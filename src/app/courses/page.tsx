import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getAllCourses, countCourseLessons } from "@/lib/courses";
import { getAllCourseLevels, getCourseLevelsMap, countCoursesByLevel } from "@/lib/courseLevels";
import CourseCard from "@/components/client/CourseCard";

export const metadata: Metadata = {
  title: "Khóa học",
  description: `Danh sách khóa học lập trình tại ${siteConfig.name}. Học JavaScript, TypeScript, React, Next.js, Node.js, Python và nhiều chủ đề khác.`,
  openGraph: {
    title: `Khóa học | ${siteConfig.name}`,
    description: "Danh sách khóa học lập trình",
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/courses`,
  },
};

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; category?: string }>;
}) {
  const params = await searchParams;
  const levelList = getAllCourseLevels();
  const levelsMap = getCourseLevelsMap();
  const allCourses = getAllCourses(true);
  const courses = allCourses.map((c) => ({
    ...c,
    lessonCount: countCourseLessons(c.id),
  }));

  const publishedCourses = courses.filter((c) => c.published);
  const activeLevels = levelList.filter((l) =>
    publishedCourses.some((c) => c.level === l.key)
  );
  const filtered = params.level && params.level !== "all"
    ? publishedCourses.filter((c) => c.level === params.level)
    : publishedCourses;
  const featuredCourses = publishedCourses.filter((c) => c.featured);

  const categories = Array.from(new Set(publishedCourses.map((c) => c.category).filter(Boolean)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Khóa học lập trình",
    description: "Danh sách khóa học lập trình tại Góc Lập Trình",
    numberOfItems: filtered.length,
    itemListElement: filtered.slice(0, 10).map((c, i) => ({
      "@type": "Course",
      position: i + 1,
      name: c.title,
      description: c.description,
      url: `${siteConfig.url}/courses/${c.slug}`,
      image: c.image || undefined,
      provider: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-[80px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Khóa học
              </h1>
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                Học lập trình từ cơ bản đến nâng cao với {publishedCourses.length} khóa học chất lượng
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{publishedCourses.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Khóa học</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-gray-800" />
              <div className="text-center">
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">{categories.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chủ đề</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Level filter */}
        <div className="py-6 -mt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/courses"
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                !params.level || params.level === "all"
                  ? "text-white bg-blue-600 shadow-sm shadow-blue-600/20"
                  : "text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              Tất cả
              <span className="text-xs opacity-80">({publishedCourses.length})</span>
            </Link>
            {activeLevels.map((level) => {
              const count = countCoursesByLevel(level.key);
              return (
                <Link
                  key={level.key}
                  href={`/courses?level=${level.key}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                    params.level === level.key
                      ? "text-white bg-blue-600 shadow-sm shadow-blue-600/20"
                      : "text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700"
                  }`}
                >
                  {level.icon} {level.label}
                  <span className="text-xs opacity-80">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎓</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {publishedCourses.length === 0 ? "Chưa có khóa học" : "Không tìm thấy khóa học"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {publishedCourses.length === 0
                ? "Hãy quay lại sau để xem các khóa học mới nhất!"
                : "Thử chọn bộ lọc khác hoặc xem tất cả khóa học."}
            </p>
          </div>
        ) : (
          <div className="pb-16">
            {/* Featured courses */}
            {featuredCourses.length > 0 && params.level !== "all" && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  Khóa học nổi bật
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} featured levels={levelsMap} />
                  ))}
                </div>
              </div>
            )}

            {/* All courses */}
            <div>
<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">
                  {params.level && params.level !== "all"
                    ? levelsMap[params.level]?.label || params.level
                    : "Tất cả khóa học"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((course) => (
                    <CourseCard key={course.id} course={course} levels={levelsMap} />
                  ))}
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}