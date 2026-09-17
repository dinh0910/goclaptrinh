import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { siteConfig } from "@/lib/constants";
import { getCourseBySlug, getCourseLessons, getEnrollmentByEmail } from "@/lib/courses";
import { getCourseLevelsMap } from "@/lib/courseLevels";
import { categoryColor } from "@/lib/categoryColors";
import { getVideoEmbed, embedUrlsToIframes } from "@/lib/embeds";
import Breadcrumb from "@/components/shared/Breadcrumb";
import CodeBlockCopy from "@/components/client/blog/CodeBlockCopy";
import LessonProgress from "@/components/client/courses/LessonProgress";

interface PageProps {
  params: Promise<{ slug: string; lessonSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, lessonSlug } = await params;
  const course = getCourseBySlug(slug);
  const lesson = course
    ? getCourseLessons(course.id).find((l) => l.slug === lessonSlug)
    : null;
  if (!course || !lesson || !lesson.published) return { title: "Không tìm thấy" };

  return {
    title: `${lesson.title} | ${course.title}`,
    description: lesson.description || course.description || `Bài học: ${lesson.title}`,
    openGraph: {
      title: `${lesson.title} | ${course.title}`,
      description: lesson.description || course.description || "",
      type: "article",
    },
    alternates: {
      canonical: `${siteConfig.url}/courses/${slug}/${lessonSlug}`,
    },
  };
}

export default async function CourseLessonPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  const lessons = getCourseLessons(course.id).filter((l) => l.published);
  const index = lessons.findIndex((l) => l.slug === lessonSlug);
  if (index === -1) notFound();

  const lesson = lessons[index];
  const prevLesson = lessons[index - 1] ?? null;
  const nextLesson = lessons[index + 1] ?? null;

  const levelMeta = getCourseLevelsMap()[course.level];
  const accent = categoryColor(levelMeta?.color);
  const levelLabel = levelMeta?.label ?? course.level;
  const levelIcon = levelMeta?.icon || "🌱";

  const session = await auth();
  const userEmail = session?.user?.email ?? "";
  const isLoggedIn = Boolean(userEmail);
  const enrollment = isLoggedIn ? getEnrollmentByEmail(course.id, userEmail) : null;
  const completedCount = enrollment?.completedLessons.length ?? 0;
  const progressPercent = enrollment?.progress ?? 0;

  const video = getVideoEmbed(lesson.videoUrl);
  const contentHtml = isLoggedIn ? embedUrlsToIframes(lesson.content || "") : "";
  const isFree = course.price <= 0;

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(
    `/courses/${course.slug}/${lesson.slug}`
  )}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.description || "",
    isPartOf: {
      "@type": "Course",
      name: course.title,
      url: `${siteConfig.url}/courses/${course.slug}`,
      provider: { "@type": "Organization", name: siteConfig.name },
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <Breadcrumb
            className="mb-8"
            itemClassName="truncate max-w-[200px]"
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Khóa học", href: "/courses" },
              { label: course.title, href: `/courses/${course.slug}` },
              { label: lesson.title },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
            {/* Main */}
            <div className="min-w-0">
              {/* Header */}
              <header className="mb-6">
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${accent.bg} ${accent.text} ${accent.darkBg} ${accent.darkText}`}>
                    {levelIcon} {levelLabel}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    Bài {index + 1} / {lessons.length}
                  </span>
                  {lesson.duration && (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {lesson.duration}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-3">
                  {lesson.title}
                </h1>
                {lesson.description && (
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {lesson.description}
                  </p>
                )}
              </header>

              {isLoggedIn ? (
                <>
                  {/* Video player */}
                  <div className="mb-6">
                    {video.type === "youtube" && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                        <iframe
                          src={video.embedUrl}
                          title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      </div>
                    )}
                    {video.type === "file" && (
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        controlsList="nodownload"
                        className="w-full aspect-video rounded-2xl bg-black shadow-lg"
                      >
                        <source src={video.url} />
                        Trình duyệt của bạn không hỗ trợ phát video.
                      </video>
                    )}
                    {video.type === "tiktok" && (
                      <div className="flex justify-center py-4">
                        <blockquote
                          className="tiktok-embed"
                          cite={video.url}
                          data-video-id={video.url.match(/\/video\/(\d+)/)?.[1]}
                          style={{ maxWidth: "605px" }}
                        >
                          <section />
                        </blockquote>
                        <script async src="https://www.tiktok.com/embed.js" />
                      </div>
                    )}
                    {video.type === "none" && lesson.videoUrl && (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-3 text-white"
                        >
                          <span className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors">
                            <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </span>
                          <span className="text-sm font-semibold">Mở video</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                    <LessonProgress
                      courseId={course.id}
                      lessonId={lesson.id}
                      initialCompleted={enrollment?.completedLessons.includes(lesson.id) ?? false}
                      completedCount={completedCount}
                      totalLessons={lessons.length}
                    />
                  </div>

                  {/* Lesson content */}
                  {contentHtml && (
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 shadow-sm">
                      <CodeBlockCopy>
                        <div
                          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-blue-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-a:text-blue-400 dark:prose-strong:text-white dark:prose-code:text-blue-400 dark:prose-pre:bg-gray-800"
                          dangerouslySetInnerHTML={{ __html: contentHtml }}
                        />
                      </CodeBlockCopy>
                    </div>
                  )}

                  {/* Prev / Next */}
                  <nav className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {prevLesson ? (
                      <Link
                        href={`/courses/${course.slug}/${prevLesson.slug}`}
                        className="group flex items-start gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all"
                      >
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bài trước</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {prevLesson.title}
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div />
                    )}
                    {nextLesson ? (
                      <Link
                        href={`/courses/${course.slug}/${nextLesson.slug}`}
                        className="group sm:text-right flex items-start justify-end gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Bài tiếp theo</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {nextLesson.title}
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    ) : (
                      <div />
                    )}
                  </nav>
                </>
              ) : (
                /* Login gate */
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                  <div className="px-6 sm:px-10 py-14 sm:py-20 text-center">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Đăng nhập để học tiếp
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-7">
                      Nội dung bài học (video và bài giảng) chỉ hiển thị với học viên đã đăng nhập. Đăng nhập để tiếp tục theo dõi tiến độ của bạn.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <Link
                        href={loginUrl}
                        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Đăng nhập
                      </Link>
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Xem thông tin khóa học
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 space-y-6">
              {/* Course summary */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <Link
                  href={`/courses/${course.slug}`}
                  className="flex items-start gap-3 group"
                >
                  {course.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${accent.gradient} flex items-center justify-center shrink-0`}>
                      <span className="text-2xl">🎓</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Khóa học</p>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.title}
                    </h2>
                    <p className={`text-xs font-semibold mt-1 ${isFree ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                      {isFree ? "Miễn phí" : course.price.toLocaleString("vi-VN") + "đ"}
                    </p>
                  </div>
                </Link>

                {isLoggedIn ? (
                  <>
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Tiến độ</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {completedCount}/{lessons.length} bài
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    Đăng nhập để theo dõi tiến độ học
                  </div>
                )}
              </div>

              {/* Lessons list */}
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Nội dung khóa học
                </h3>
                <ol className="space-y-1 max-h-[480px] overflow-y-auto pr-1">
                  {lessons.map((l, idx) => {
                    const isCurrent = l.id === lesson.id;
                    const done = enrollment?.completedLessons.includes(l.id) ?? false;
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/courses/${course.slug}/${l.slug}`}
                          className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                            isCurrent
                              ? "bg-blue-50 dark:bg-blue-500/10"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          <span
                            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                              done
                                ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                : isCurrent
                                  ? `bg-gradient-to-br ${accent.gradient} text-white`
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {done ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            ) : (
                              idx + 1
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className={`block text-sm font-medium truncate ${isCurrent ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}>
                              {l.title}
                            </span>
                            <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                              {l.videoUrl ? "🎬 Video" : "📄 Bài đọc"}
                              {l.duration ? ` · ${l.duration}` : ""}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}