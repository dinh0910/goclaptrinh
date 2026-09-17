import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setLessonCompleted, getCourseLessons } from "@/lib/courses";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    const { courseId: courseIdRaw, lessonId: lessonIdRaw } = await context.params;
    const courseId = Number(courseIdRaw);
    const lessonId = Number(lessonIdRaw);
    if (!Number.isInteger(courseId) || !Number.isInteger(lessonId)) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as { completed?: unknown };
    if (typeof body.completed !== "boolean") {
      return NextResponse.json({ error: "completed không hợp lệ" }, { status: 400 });
    }

    const lessonExists = getCourseLessons(courseId).some((l) => l.id === lessonId);
    if (!lessonExists) {
      return NextResponse.json({ error: "Không tìm thấy bài học" }, { status: 404 });
    }

    const progress = setLessonCompleted(
      courseId,
      lessonId,
      session.user.email,
      body.completed
    );
    if (!progress) {
      return NextResponse.json({ error: "Không thể lưu tiến độ" }, { status: 500 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("POST /api/courses/[courseId]/lessons/[lessonId]/progress failed", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}