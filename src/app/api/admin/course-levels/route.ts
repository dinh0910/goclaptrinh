import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseLevels } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const revalidate = 0;

export async function GET() {
  try {
    const rows = db
      .select()
      .from(courseLevels)
      .all();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch course levels" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const key = String(body.key || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    const label = String(body.label || "").trim();

    if (!key || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      return NextResponse.json({ error: "Mã cấp độ không hợp lệ (chỉ chữ thường, số và dấu gạch ngang)" }, { status: 400 });
    }
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

    const duplicate = db.select().from(courseLevels).where(eq(courseLevels.key, key)).get();
    if (duplicate) {
      return NextResponse.json({ error: "Mã cấp độ đã tồn tại" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const result = db.insert(courseLevels).values({
      key,
      label,
      description: String(body.description || "").slice(0, 300),
      icon: String(body.icon || "🌱").slice(0, 16),
      color: String(body.color || "blue").slice(0, 20),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 1,
      createdAt: now,
      updatedAt: now,
    }).returning().get();

    logAudit({
      action: AUDIT_ACTIONS.courseLevelCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course-level",
      entityId: String(result.id),
      detail: { key: result.key, label: result.label },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/course-levels failed", error);
    return NextResponse.json({ error: "Failed to create course level" }, { status: 500 });
  }
}