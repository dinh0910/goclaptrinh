import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import LessonForm from "@/components/admin/LessonForm";

export const metadata = {
  title: "Thêm bài học",
};

export default async function NewLessonPage({
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

  return (
    <LessonForm
      mode="create"
      courseId={course.id}
      courseSlug={course.slug}
      courseTitle={course.title}
    />
  );
}