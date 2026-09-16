import { getCategoriesWithCounts } from "@/lib/categories";
import { getAllCourseLevels } from "@/lib/courseLevels";
import CourseEditor from "@/components/admin/CourseEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Thêm khóa học mới",
};

export default async function NewCoursePage() {
  if (!(await requireAuth([PERMISSIONS.courses]))) {
    notFound();
  }
  const categories = getCategoriesWithCounts({ includeUnpublished: true });
  const levels = getAllCourseLevels();

  return (
    <CourseEditor
      mode="create"
      categories={categories.map((c) => ({ slug: c.slug, name: c.name, icon: c.icon }))}
      levels={levels.map((l) => ({ key: l.key, label: l.label, icon: l.icon }))}
    />
  );
}