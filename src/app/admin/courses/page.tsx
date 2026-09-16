import { db } from "@/lib/db";
import { courses, courseLessons } from "@/lib/db/schema";
import { getAllCourseLevels } from "@/lib/courseLevels";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import CourseTable from "@/components/admin/CourseTable";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Quản lý khóa học",
};

export default async function AdminCoursesPage() {
  if (!(await requireAuth([PERMISSIONS.courses]))) {
    notFound();
  }

  const courseList = db.select().from(courses).orderBy(courses.createdAt).all();
  const lessonCounts = db
    .select({ courseId: courseLessons.courseId })
    .from(courseLessons)
    .all();
  const countMap = new Map<number, number>();
  for (const l of lessonCounts) {
    countMap.set(l.courseId, (countMap.get(l.courseId) ?? 0) + 1);
  }

  const rows = courseList.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    level: c.level,
    price: c.price,
    category: c.category,
    featured: c.featured,
    published: c.published,
    lessonCount: countMap.get(c.id) ?? 0,
  }));

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Khóa học" },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Khóa học
      </h1>

      <CourseTable courses={rows} levels={getAllCourseLevels()} />
    </div>
  );
}