import Link from "next/link";
import { Course, CourseLevel } from "@/lib/types";
import { categoryColor } from "@/lib/categoryColors";

interface CourseCardProps {
  course: Course;
  featured?: boolean;
  levels?: Record<string, CourseLevel>;
}

function levelChip(levelKey: string, levels?: Record<string, CourseLevel>): {
  label: string;
  icon: string;
  className: string;
} {
  const level = levels?.[levelKey];
  if (!level) {
    return {
      label: levelKey,
      icon: "🌱",
      className: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
  }
  const color = categoryColor(level.color);
  return {
    label: level.label,
    icon: level.icon || "🌱",
    className: `${color.bg} ${color.text} ${color.darkBg} ${color.darkText}`,
  };
}

export default function CourseCard({ course, featured = false, levels }: CourseCardProps) {
  const chip = levelChip(course.level, levels);

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-500 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800">
        <div className="relative h-56 overflow-hidden">
          {course.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={course.image}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <span className="text-5xl">🎓</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${chip.className} backdrop-blur-sm bg-white/80 dark:bg-gray-900/80`}>
              {chip.icon} {chip.label}
            </span>
          </div>
          {course.featured && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                  <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.64 1.12 6.53L12 17.77l-5.87 3.09 1.12-6.53L2.5 9.27l6.6-1.01Z" />
                </svg>
                Nổi bật
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          {course.category && (
            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mb-3">
              {course.category}
            </span>
          )}

          <Link href={`/courses/${course.slug}`}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
              {course.title}
            </h2>
          </Link>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              {course.duration && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {course.duration}
                </span>
              )}
              {course.lessonCount !== undefined && course.lessonCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  {course.lessonCount} bài
                </span>
              )}
            </div>
            <span className={`text-base font-bold ${course.price > 0 ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
              {course.price > 0 ? course.price.toLocaleString("vi-VN") + "đ" : "Miễn phí"}
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800">
      <div className="relative h-44 overflow-hidden">
        {course.image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <span className="text-4xl">🎓</span>
          </div>
        )}
        <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[11px] font-semibold rounded-md backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 ${chip.className}`}>
          {chip.icon} {chip.label}
        </span>
      </div>

      <div className="p-4">
        {course.category && (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mb-2">
            {course.category}
          </span>
        )}

        <Link href={`/courses/${course.slug}`}>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h2>
        </Link>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
            {course.duration && <span>{course.duration}</span>}
            {course.lessonCount !== undefined && course.lessonCount > 0 && (
              <span>{course.lessonCount} bài</span>
            )}
          </div>
          <span className={`text-sm font-bold ${course.price > 0 ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"}`}>
            {course.price > 0 ? course.price.toLocaleString("vi-VN") + "đ" : "Miễn phí"}
          </span>
        </div>
      </div>
    </article>
  );
}