import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseLevels, courses } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const revalidate = 0;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const levelId = Number(id);
    if (!Number.isInteger(levelId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const level = db.select().from(courseLevels).where(eq(courseLevels.id, levelId)).get();
    if (!level) {
      return NextResponse.json({ error: "Không tìm thấy cấp độ" }, { status: 404 });
    }
    return NextResponse.json(level);
  } catch {
    return NextResponse.json({ error: "Failed to fetch course level" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) return unauthorizedJson();

    const { id } = await context.params;
    const levelId = Number(id);
    if (!Number.isInteger(levelId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db.select().from(courseLevels).where(eq(courseLevels.id, levelId)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy cấp độ" }, { status: 404 });
    }

    const body = await request.json();
    let key = existing.key;
    if (body.key !== undefined) {
      key = String(body.key).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
      if (!key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
        return NextResponse.json({ error: "Mã cấp độ không hợp lệ (chỉ chữ thường, số và dấu gạch ngang)" }, { status: 400 });
      }
      const dup = db
        .select()
        .from(courseLevels)
        .where(and(eq(courseLevels.key, key), ne(courseLevels.id, levelId)))
        .get();
      if (dup) {
        return NextResponse.json({ error: "Mã cấp độ đã tồn tại" }, { status: 409 });
      }
    }

    const label = body.label !== undefined ? String(body.label).trim() : existing.label;
    if (!label || label.length > 50) {
      return NextResponse.json({ error: "Tên cấp độ là bắt buộc (tối đa 50 ký tự)" }, { status: 400 });
    }
    if (body.icon !== undefined && typeof body.icon !== "string") {
      return NextResponse.json({ error: "icon không hợp lệ" }, { status: 400 });
    }
    if (body.color !== undefined && typeof body.color !== "string") {
      return NextResponse.json({ error: "Màu không hợp lệ" }, { status: 400 });
    }
    if (body.sortOrder !== undefined && (typeof body.sortOrder !== "number" || !Number.isInteger(body.sortOrder) || body.sortOrder < 1)) {
      return NextResponse.json({ error: "Thứ tự sắp xếp phải là số nguyên dương (≥ 1)" }, { status: 400 });
    }

    const updated = db.update(courseLevels).set({
      key,
      label,
      description: body.description !== undefined ? String(body.description).slice(0, 300) : existing.description,
      icon: body.icon !== undefined ? String(body.icon).slice(0, 16) : existing.icon,
      color: body.color !== undefined ? String(body.color).slice(0, 20) : existing.color,
      sortOrder: body.sortOrder !== undefined ? body.sortOrder : existing.sortOrder,
      updatedAt: new Date().toISOString(),
    }).where(eq(courseLevels.id, levelId)).returning().get();

    // If the level key changed, keep existing courses pointing at the same level.
    if (key !== existing.key) {
      db.update(courses)
        .set({ level: key })
        .where(eq(courses.level, existing.key))
        .run();
    }

    logAudit({
      action: AUDIT_ACTIONS.courseLevelUpdate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course-level",
      entityId: String(levelId),
      detail: { key: updated.key, label: updated.label },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/course-levels/[id] failed", error);
    return NextResponse.json({ error: "Failed to update course level" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) return unauthorizedJson();

    const { id } = await context.params;
    const levelId = Number(id);
    if (!Number.isInteger(levelId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db.select().from(courseLevels).where(eq(courseLevels.id, levelId)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy cấp độ" }, { status: 404 });
    }

    const usage = db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.level, existing.key))
      .all();
    if (usage.length > 0) {
      return NextResponse.json(
        { error: `Không thể xóa: cấp độ "${existing.label}" đang được ${usage.length} khóa học sử dụng` },
        { status: 409 }
      );
    }

    db.delete(courseLevels).where(eq(courseLevels.id, levelId)).run();

    logAudit({
      action: AUDIT_ACTIONS.courseLevelDelete,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course-level",
      entityId: String(levelId),
      detail: { key: existing.key, label: existing.label },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/course-levels/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete course level" }, { status: 500 });
  }
}