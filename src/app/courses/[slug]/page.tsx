import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/constants";
import { getCourseBySlug, getCourseLessons, getAllCourses, countCourseLessons } from "@/lib/courses";
import { getCourseLevelsMap } from "@/lib/courseLevels";
import { categoryColor } from "@/lib/categoryColors";
import CourseCard from "@/components/client/courses/CourseCard";
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
  const accent = categoryColor(levelMeta?.color);
  const level = levelMeta
    ? { label: levelMeta.label, icon: levelMeta.icon || "🌱", color: levelMeta.color }
    : { label: course.level, icon: "🌱", color: "gray" };

  const relatedCourses = getAllCourses()
    .filter((c) => c.id !== course.id)
    .slice(0, 3)
    .map((c) => ({ ...c, lessonCount: countCourseLessons(c.id) }));

  const updatedDate = new Date(course.updatedAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const isFree = course.price <= 0;
  const formattedPrice = course.price.toLocaleString("vi-VN") + "đ";

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
    offers: {
      "@type": "Offer",
      price: isFree ? 0 : course.price,
      priceCurrency: "VND",
      category: isFree ? "Free" : "Paid",
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="absolute inset-0">
          <div className={`absolute top-[-10%] right-[-5%] w-[460px] h-[460px] rounded-full ${accent.bg} ${accent.darkBg} blur-[110px]`} />
          <div className="absolute bottom-[-15%] left-[-8%] w-[380px] h-[380px] rounded-full bg-blue-400/10 dark:bg-blue-600/15 blur-[100px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <Breadcrumb
            className="mb-8"
            itemClassName="truncate max-w-[250px]"
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Khóa học", href: "/courses" },
              { label: course.title },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-10 lg:gap-14 items-center">
            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${accent.bg} ${accent.text} ${accent.darkBg} ${accent.darkText}`}>
                  {level.icon} {level.label}
                </span>
                {course.category && (
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    {course.category}
                  </span>
                )}
                {course.featured && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                      <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.64 1.12 6.53L12 17.77l-5.87 3.09 1.12-6.53L2.5 9.27l6.6-1.01Z" />
                    </svg>
                    Nổi bật
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-5">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mb-7">
                  {course.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-3 flex-wrap mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {publishedLessons.length} bài học
                  </span>
                </div>
                {course.duration && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {course.duration}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full shadow-sm">
                  <span className="text-base">{level.icon}</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{level.label}</span>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center gap-5 flex-wrap">
                <div className={`text-3xl sm:text-4xl font-extrabold ${isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                  {isFree ? "Miễn phí" : formattedPrice}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href="#noi-dung"
                    className={`inline-flex items-center gap-2 px-7 py-3 text-base font-semibold text-white rounded-xl shadow-lg transition-colors ${isFree ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
                  >
                    {isFree ? "Bắt đầu học ngay" : "Đăng ký ngay"}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </a>
                  <a
                    href="#noi-dung"
                    className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    Xem nội dung
                  </a>
                </div>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="w-full">
              <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl shadow-blue-500/10">
                {course.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-[300px] sm:h-[360px] object-cover"
                  />
                ) : (
                  <div className={`w-full h-[300px] sm:h-[360px] bg-gradient-to-br ${accent.gradient} flex items-center justify-center`}>
                    <span className="text-7xl drop-shadow-lg">🎓</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1.5 text-xs font-semibold text-white bg-black/40 backdrop-blur-sm rounded-full">
                    Cập nhật {updatedDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-10 items-start">
          {/* Main */}
          <div className="space-y-10 min-w-0">
            {/* Highlights */}
            <section className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Bạn sẽ nhận được gì?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {[
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    ),
                    title: `${publishedLessons.length} bài học`,
                    desc: publishedLessons.length > 0 ? "Nội dung được sắp xếp khoa học, học theo từng bước" : "Khóa học đang được bổ sung nội dung",
                  },
                  ...(course.duration ? [{
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    title: course.duration,
                    desc: "Học theo tốc độ của riêng bạn",
                  }] : []),
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
                      </svg>
                    ),
                    title: "Học tập linh hoạt",
                    desc: "Video và bài đọc được cung cấp đầy đủ",
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                      </svg>
                    ),
                    title: "Chia sẻ kiến thức thực tế",
                    desc: "Ví dụ minh họa và kinh nghiệm thực chiến",
                  },
                  {
                    icon: (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.035A9 9 0 001.188 6A9 9 0 0012 21.75 9 9 0 0022.813 6 9 9 0 0012 5.715z" />
                      </svg>
                    ),
                    title: "Học mãi mãi",
                    desc: "Truy cập trọn đời, học mọi lúc mọi nơi",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            <section id="noi-dung" className="scroll-mt-24">
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nội dung khóa học
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {publishedLessons.length} bài
                </span>
              </div>

              {publishedLessons.length === 0 ? (
                <div className="text-center py-14 border border-dashed border-gray-300 dark:border-gray-700 rounded-3xl">
                  <span className="text-4xl">📝</span>
                  <p className="mt-3 text-gray-500 dark:text-gray-400">
                    Khóa học đang được cập nhật nội dung...
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  {publishedLessons.map((lesson, idx) => {
                    const hasVideo = Boolean(lesson.videoUrl);
                    const hasContent = Boolean(lesson.content);
                    const isLast = idx === publishedLessons.length - 1;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${course.slug}/${lesson.slug}`}
                        className={`group flex items-start gap-4 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isLast ? "" : "border-b border-gray-100 dark:border-gray-800"}`}
                      >
                        <div className={`shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center ${accent.bg} ${accent.text} ${accent.darkBg} ${accent.darkText} group-hover:scale-110 transition-transform`}>
                          <span className="text-sm font-bold">{String(idx + 1).padStart(2, "0")}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {lesson.title}
                          </h3>
                          {lesson.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                          {(hasVideo || hasContent || lesson.duration) && (
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                              {lesson.duration && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {lesson.duration}
                                </span>
                              )}
                              {hasVideo && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                                  </svg>
                                  Video
                                </span>
                              )}
                              {hasContent && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  Bài đọc
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                            {isFree ? "Miễn phí" : "Có phí"}
                          </span>
                          <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 transition-all">
                            <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            {/* Enrollment card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm overflow-hidden">
              <div className="flex items-start justify-between gap-3 mb-5">
                <div>
                  <div className={`text-3xl font-extrabold ${isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                    {isFree ? "Miễn phí" : formattedPrice}
                  </div>
                  {isFree && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Không cần thanh toán, học ngay
                    </p>
                  )}
                </div>
                {!isFree && (
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                    Giá ưu đãi
                  </span>
                )}
              </div>

              <a
                href="#noi-dung"
                className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-semibold text-white rounded-xl shadow-lg transition-colors mb-5 ${isFree ? "bg-green-600 hover:bg-green-700 shadow-green-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
              >
                {isFree ? "Bắt đầu học ngay" : "Đăng ký ngay"}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>

              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                {publishedLessons.length > 0 && (
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {publishedLessons.length} bài học chất lượng
                  </li>
                )}
                {course.duration && (
                  <li className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Thời lượng: {course.duration}
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Video và tài liệu bài giảng
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Truy cập trọn đời
                </li>
                <li className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Chứng chỉ hoàn thành
                </li>
              </ul>
            </div>

            {/* Course info */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Thông tin khóa học
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Trình độ</dt>
                  <dd className="flex items-center gap-1.5 font-medium text-gray-900 dark:text-white">
                    {level.icon} {level.label}
                  </dd>
                </div>
                {course.category && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Danh mục</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{course.category}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Bài học</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{publishedLessons.length} bài</dd>
                </div>
                {course.duration && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">Thời lượng</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{course.duration}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Giá</dt>
                  <dd className={`font-medium ${isFree ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                    {isFree ? "Miễn phí" : formattedPrice}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500 dark:text-gray-400">Cập nhật</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{updatedDate}</dd>
                </div>
              </dl>
            </div>

            {/* Tags */}
            {course.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
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

        {/* Related courses */}
        {relatedCourses.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Khóa học liên quan
              </h2>
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Xem tất cả
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCourses.map((courseItem) => (
                <CourseCard
                  key={courseItem.id}
                  course={courseItem}
                  levels={getCourseLevelsMap()}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}