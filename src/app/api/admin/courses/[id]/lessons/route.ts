import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseLessons } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";
import { uniqueLessonSlug } from "@/lib/courseLessons";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const courseId = Number(id);
    if (!Number.isInteger(courseId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const lessons = db
      .select()
      .from(courseLessons)
      .where(eq(courseLessons.courseId, courseId))
      .orderBy(courseLessons.orderIndex)
      .all();
    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title || title.length > 200) {
      return NextResponse.json({ error: "Tiêu đề là bắt buộc (tối đa 200 ký tự)" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const videoUrl = String(body.videoUrl || "").trim().slice(0, 1000);

    if (videoUrl && !/^(https?:\/\/|\/)/i.test(videoUrl)) {
      return NextResponse.json({ error: "URL video không hợp lệ" }, { status: 400 });
    }

    const result = db.insert(courseLessons).values({
      courseId,
      slug: uniqueLessonSlug(title),
      title,
      description: String(body.description || "").slice(0, 600),
      content: String(body.content || "").slice(0, 300_000),
      videoUrl,
      orderIndex: typeof body.orderIndex === "number" ? body.orderIndex : 0,
      duration: String(body.duration || "").slice(0, 50),
      published: typeof body.published === "boolean" ? body.published : true,
      createdAt: now,
      updatedAt: now,
    }).returning().get();

    logAudit({
      action: AUDIT_ACTIONS.lessonCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "lesson",
      entityId: String(result.id),
      detail: { courseId, title: result.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/courses/[id]/lessons failed", error);
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
  }
}