import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses, courseLessons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import LessonsManager from "@/components/admin/LessonsManager";

export const metadata = {
  title: "Quản lý bài học",
};

export default async function CourseLessonsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await requireAuth([PERMISSIONS.courses]))) {
    notFound();
  }
  const { slug } = await params;

  const course = db.select().from(courses).where(eq(courses.slug, slug)).get();

  if (!course) {
    notFound();
  }

  const lessons = db
    .select()
    .from(courseLessons)
    .where(eq(courseLessons.courseId, course.id))
    .orderBy(courseLessons.orderIndex)
    .all();

  return (
    <LessonsManager
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
      initialLessons={lessons.map((l) => ({
        ...l,
        published: l.published,
      }))}
    />
  );
}