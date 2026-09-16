import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses, courseLessons } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import LessonForm from "@/components/admin/LessonForm";

export const metadata = {
  title: "Chỉnh sửa bài học",
};

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  if (!(await requireAuth([PERMISSIONS.courses]))) {
    notFound();
  }
  const { slug, lessonSlug } = await params;

  const course = db.select().from(courses).where(eq(courses.slug, slug)).get();

  if (!course) {
    notFound();
  }

  const lesson = db
    .select()
    .from(courseLessons)
    .where(and(eq(courseLessons.courseId, course.id), eq(courseLessons.slug, lessonSlug)))
    .get();

  if (!lesson) {
    notFound();
  }

  return (
    <LessonForm
      mode="edit"
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      initialData={{
        id: lesson.id,
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        content: lesson.content,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        published: lesson.published,
      }}
    />
  );
}