import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategoriesWithCounts } from "@/lib/categories";
import { getAllCourseLevels } from "@/lib/courseLevels";
import CourseEditor from "@/components/admin/courses/CourseEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Chỉnh sửa khóa học",
};

export default async function EditCoursePage({
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

  const categories = getCategoriesWithCounts({ includeUnpublished: true });
  const levels = getAllCourseLevels();

  return (
    <CourseEditor
      mode="edit"
      slug={course.slug}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))}
      levels={levels.map((l) => ({ key: l.key, label: l.label, icon: l.icon }))}
      initialData={{
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: course.description,
        image: course.image,
        level: course.level,
        price: course.price,
        category: course.category,
        tags: course.tags || [],
        published: course.published,
        featured: course.featured,
        duration: course.duration,
      }}
    />
  );
}