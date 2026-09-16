import Link from "next/link";
import { db } from "@/lib/db";
import { courses } from "@/lib/db/schema";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import { getAllCourseLevels } from "@/lib/courseLevels";
import LevelManager from "@/components/admin/LevelManager";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Cấp độ khóa học",
};

export default async function AdminCourseLevelsPage() {
  if (!(await requireAuth([PERMISSIONS.courses]))) {
    notFound();
  }

  const levels = getAllCourseLevels();
  const levelCoursesCount: Record<string, number> = {};
  const courseLevelsRows = db
    .select({ level: courses.level })
    .from(courses)
    .all();
  for (const row of courseLevelsRows) {
    levelCoursesCount[row.level] = (levelCoursesCount[row.level] ?? 0) + 1;
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Khóa học", href: "/admin/courses" },
          { label: "Cấp độ khóa học" },
        ]}
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cấp độ khóa học
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Cấu hình các cấp độ (Cơ bản, Trung cấp, Nâng cao...) hiển thị trên khóa học
          </p>
        </div>
        <Link
          href="/admin/courses"
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          &larr; Về danh sách khóa học
        </Link>
      </div>

      <LevelManager initialLevels={levels} levelCoursesCount={levelCoursesCount} />
    </div>
  );
}