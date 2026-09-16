import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/constants";
import { getCourseBySlug, getCourseLessons } from "@/lib/courses";
import { getCourseLevelsMap } from "@/lib/courseLevels";
import { categoryColor } from "@/lib/categoryColors";
import Breadcrumb from "@/components/shared/Breadcrumb";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) return { title: "Không tìm thấy" };

  return {
    title: course.title,
    description: course.description || `Khóa học ${course.title}`,
    openGraph: {
      title: course.title,
      description: course.description || "",
      type: "article",
      images: course.image ? [{ url: course.image, width: 1200, height: 630, alt: course.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description || "",
      images: course.image ? [course.image] : undefined,
    },
    alternates: {
      canonical: `${siteConfig.url}/courses/${slug}`,
    },
  };
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = getCourseLessons(course.id);
  const publishedLessons = lessons.filter((l) => l.published);
  const levelMeta = getCourseLevelsMap()[course.level];
  const level = levelMeta
    ? {
        label: levelMeta.label,
        icon: levelMeta.icon || "🌱",
        className: `${categoryColor(levelMeta.color).bg} ${categoryColor(levelMeta.color).text} ${categoryColor(levelMeta.color).darkBg} ${categoryColor(levelMeta.color).darkText}`,
      }
    : { label: course.level, icon: "🌱", className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || "",
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    image: course.image || undefined,
    educationalLevel: level.label,
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
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-6"
            itemClassName="truncate max-w-[250px]"
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Khóa học", href: "/courses" },
              { label: course.title },
            ]}
          />

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg ${level.className}`}>
                  {level.icon} {level.label}
                </span>
                {course.category && (
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    {course.category}
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6 max-w-2xl">
                  {course.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-6 flex-wrap">
                {course.duration && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.duration}
                  </div>
                )}
                {publishedLessons.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    {publishedLessons.length} bài học
                  </div>
                )}
              </div>

              {/* Price + CTA */}
              <div className="flex items-center gap-5 mt-8">
                <div className={`text-3xl font-bold ${course.price > 0 ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
                  {course.price > 0 ? course.price.toLocaleString("vi-VN") + "đ" : "Miễn phí"}
                </div>
                <button
                  className="px-8 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
                >
                  {course.price > 0 ? "Đăng ký ngay" : "Bắt đầu học"}
                </button>
              </div>
            </div>

            {/* Thumbnail */}
            {course.image && (
              <div className="w-full lg:w-[400px] shrink-0 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Main */}
          <div className="space-y-10">
            {/* Lessons */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Nội dung khóa học ({publishedLessons.length} bài)
              </h2>
              {publishedLessons.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 py-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  Khóa học đang được cập nhật nội dung...
                </p>
              ) : (
                <div className="space-y-3">
                  {publishedLessons.map((lesson, idx) => (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-200 hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800"
                    >
                      <div className="shrink-0 w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {lesson.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {lesson.duration && <span>{lesson.duration}</span>}
                          {lesson.videoUrl && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                              </svg>
                              Video
                            </span>
                          )}
                          {lesson.content && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                              Bài đọc
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            {/* Price card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <div className={`text-3xl font-bold mb-4 ${course.price > 0 ? "text-gray-900 dark:text-white" : "text-green-600 dark:text-green-400"}`}>
                {course.price > 0 ? course.price.toLocaleString("vi-VN") + "đ" : "Miễn phí"}
              </div>
              <button className="w-full px-4 py-3 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors mb-4">
                {course.price > 0 ? "Đăng ký ngay" : "Bắt đầu học"}
              </button>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {publishedLessons.length > 0 && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    {publishedLessons.length} bài học
                  </li>
                )}
                {course.duration && (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {course.duration}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                  </svg>
                  Truy cập trọn đời
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  </svg>
                  Chứng chỉ hoàn thành
                </li>
              </ul>
            </div>

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}