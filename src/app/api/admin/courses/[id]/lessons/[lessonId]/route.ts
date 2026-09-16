import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseLessons } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";
import { uniqueLessonSlug } from "@/lib/courseLessons";

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id, lessonId } = await context.params;
    const courseId = Number(id);
    const lessonNumber = Number(lessonId);
    if (!Number.isInteger(courseId) || !Number.isInteger(lessonNumber)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db
      .select()
      .from(courseLessons)
      .where(and(eq(courseLessons.id, lessonNumber), eq(courseLessons.courseId, courseId)))
      .get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const body = await request.json();

    let title = existing.title;
    if (body.title !== undefined) {
      title = String(body.title).trim();
      if (!title || title.length > 200) {
        return NextResponse.json({ error: "Tiêu đề là bắt buộc (tối đa 200 ký tự)" }, { status: 400 });
      }
    }

    const newSlug =
      title !== existing.title ? uniqueLessonSlug(title, lessonNumber) : existing.slug;

    let videoUrl = existing.videoUrl;
    if (body.videoUrl !== undefined) {
      videoUrl = String(body.videoUrl).trim().slice(0, 1000);
      if (videoUrl && !/^(https?:\/\/|\/)/i.test(videoUrl)) {
        return NextResponse.json({ error: "URL video không hợp lệ" }, { status: 400 });
      }
    }

    const updated = db.update(courseLessons).set({
      slug: newSlug,
      title,
      description: body.description !== undefined ? String(body.description).slice(0, 600) : existing.description,
      content: body.content !== undefined ? String(body.content).slice(0, 300_000) : existing.content,
      videoUrl,
      orderIndex: body.orderIndex !== undefined && typeof body.orderIndex === "number" ? body.orderIndex : existing.orderIndex,
      duration: body.duration !== undefined ? String(body.duration).slice(0, 50) : existing.duration,
      published: body.published !== undefined && typeof body.published === "boolean" ? body.published : existing.published,
      updatedAt: new Date().toISOString(),
    }).where(eq(courseLessons.id, lessonNumber)).returning().get();

    logAudit({
      action: AUDIT_ACTIONS.lessonUpdate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "lesson",
      entityId: String(lessonNumber),
      detail: { courseId, title: updated.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/admin/courses/[id]/lessons/[lessonId] failed", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string; lessonId: string }> }) {
  try {
    const session = await requireAuth([PERMISSIONS.courses]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id, lessonId } = await context.params;
    const courseId = Number(id);
    const lessonNumber = Number(lessonId);
    if (!Number.isInteger(courseId) || !Number.isInteger(lessonNumber)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const existing = db
      .select()
      .from(courseLessons)
      .where(and(eq(courseLessons.id, lessonNumber), eq(courseLessons.courseId, courseId)))
      .get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    db.delete(courseLessons)
      .where(and(eq(courseLessons.id, lessonNumber), eq(courseLessons.courseId, courseId)))
      .run();

    logAudit({
      action: AUDIT_ACTIONS.lessonDelete,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "lesson",
      entityId: String(lessonNumber),
      detail: { courseId, title: existing.title },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/courses/[id]/lessons/[lessonId] failed", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}