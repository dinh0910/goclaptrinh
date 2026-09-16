import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";
import { isValidCourseLevel } from "@/lib/courseLevels";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const courseId = Number(id);
    if (!Number.isInteger(courseId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const course = db.select().from(courses).where(eq(courses.id, courseId)).get();
    if (!course) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id } = await context.params;
    const courseId = Number(id);
    if (!Number.isInteger(courseId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db.select().from(courses).where(eq(courses.id, courseId)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    const body = await request.json();

    let slug = existing.slug;
    if (body.slug !== undefined) {
      slug = String(body.slug).trim().toLowerCase();
      if (!slug || !SLUG_RE.test(slug)) {
        return NextResponse.json({ error: "Slug không hợp lệ (chỉ chữ thường, số và dấu gạch ngang)" }, { status: 400 });
      }
      const dup = db
        .select()
        .from(courses)
        .where(and(eq(courses.slug, slug), ne(courses.id, courseId)))
        .get();
      if (dup) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
    }

    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Tiêu đề là bắt buộc (tối đa 200 ký tự)" }, { status: 400 });
    }
    if (body.level !== undefined && !isValidCourseLevel(String(body.level))) {
      return NextResponse.json({ error: "Cấp độ không hợp lệ" }, { status: 400 });
    }
    if (body.price !== undefined && (typeof body.price !== "number" || !Number.isInteger(body.price) || body.price < 0 || body.price > 100_000_000)) {
      return NextResponse.json({ error: "Giá không hợp lệ" }, { status: 400 });
    }
    if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some((t: unknown) => typeof t !== "string"))) {
      return NextResponse.json({ error: "Tags không hợp lệ" }, { status: 400 });
    }
    if (body.published !== undefined && typeof body.published !== "boolean") {
      return NextResponse.json({ error: "published không hợp lệ" }, { status: 400 });
    }
    if (body.featured !== undefined && typeof body.featured !== "boolean") {
      return NextResponse.json({ error: "featured không hợp lệ" }, { status: 400 });
    }

    const updated = db.update(courses).set({
      slug,
      title,
      description: body.description !== undefined ? String(body.description).slice(0, 600) : existing.description,
      image: body.image !== undefined ? String(body.image).slice(0, 500) : existing.image,
      level: body.level !== undefined ? String(body.level) : existing.level,
      price: body.price !== undefined ? body.price : existing.price,
      category: body.category !== undefined ? String(body.category).slice(0, 100) : existing.category,
      tags: body.tags !== undefined ? (body.tags as string[]).slice(0, 20) : existing.tags,
      published: body.published !== undefined ? body.published : existing.published,
      featured: body.featured !== undefined ? body.featured : existing.featured,
      duration: body.duration !== undefined ? String(body.duration).slice(0, 50) : existing.duration,
      updatedAt: new Date().toISOString(),
    }).where(eq(courses.id, courseId)).returning().get();

    logAudit({
      action: AUDIT_ACTIONS.courseUpdate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course",
      entityId: String(courseId),
      detail: { title: updated.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/courses/[id] failed", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id } = await context.params;
    const courseId = Number(id);
    if (!Number.isInteger(courseId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db.select().from(courses).where(eq(courses.id, courseId)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy khóa học" }, { status: 404 });
    }

    db.delete(courses).where(eq(courses.id, courseId)).run();

    logAudit({
      action: AUDIT_ACTIONS.courseDelete,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course",
      entityId: String(courseId),
      detail: { title: existing.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/courses/[id] failed", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}