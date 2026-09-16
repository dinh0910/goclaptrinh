import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";
import { isValidCourseLevel } from "@/lib/courseLevels";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export async function GET() {
  try {
    const rows = db
      .select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        description: courses.description,
        image: courses.image,
        level: courses.level,
        price: courses.price,
        category: courses.category,
        tags: courses.tags,
        published: courses.published,
        featured: courses.featured,
        duration: courses.duration,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .all();
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) {
      return unauthorizedJson();
    }
    const body = await request.json();

    const slug = String(body.slug || "").trim().toLowerCase();
    const title = String(body.title || "").trim();
    if (!slug || !SLUG_RE.test(slug)) {
      return NextResponse.json({ error: "Slug không hợp lệ (chỉ chữ thường, số và dấu gạch ngang)" }, { status: 400 });
    }
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

    const existing = db.select().from(courses).where(eq(courses.slug, slug)).get();
    if (existing) {
      return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const result = db.insert(courses).values({
      slug,
      title,
      description: String(body.description || "").slice(0, 600),
      image: String(body.image || "").slice(0, 500),
      level: String(body.level || "beginner"),
      price: typeof body.price === "number" ? body.price : 0,
      category: String(body.category || "").slice(0, 100),
      tags: Array.isArray(body.tags) ? (body.tags as string[]).slice(0, 20) : [],
      published: typeof body.published === "boolean" ? body.published : false,
      featured: typeof body.featured === "boolean" ? body.featured : false,
      duration: String(body.duration || "").slice(0, 50),
      createdAt: now,
      updatedAt: now,
    }).returning().get();

    logAudit({
      action: AUDIT_ACTIONS.courseCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "course",
      entityId: String(result.id),
      detail: { title: result.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/courses failed", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}