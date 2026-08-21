import Link from "next/link";
import { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string; gradient: string }> = {
  javascript: { bg: "bg-yellow-50", text: "text-yellow-700", darkBg: "dark:bg-yellow-500/10", darkText: "dark:text-yellow-400", gradient: "from-yellow-400 to-orange-400" },
  typescript: { bg: "bg-blue-50", text: "text-blue-700", darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-400", gradient: "from-blue-400 to-blue-600" },
  react: { bg: "bg-cyan-50", text: "text-cyan-700", darkBg: "dark:bg-cyan-500/10", darkText: "dark:text-cyan-400", gradient: "from-cyan-400 to-cyan-600" },
  nextjs: { bg: "bg-gray-50", text: "text-gray-700", darkBg: "dark:bg-gray-200/10", darkText: "dark:text-gray-300", gradient: "from-gray-400 to-gray-600" },
  nodejs: { bg: "bg-green-50", text: "text-green-700", darkBg: "dark:bg-green-500/10", darkText: "dark:text-green-400", gradient: "from-green-400 to-green-600" },
  python: { bg: "bg-sky-50", text: "text-sky-700", darkBg: "dark:bg-sky-500/10", darkText: "dark:text-sky-400", gradient: "from-sky-400 to-sky-600" },
  devops: { bg: "bg-purple-50", text: "text-purple-700", darkBg: "dark:bg-purple-500/10", darkText: "dark:text-purple-400", gradient: "from-purple-400 to-purple-600" },
  "co-ban": { bg: "bg-emerald-50", text: "text-emerald-700", darkBg: "dark:bg-emerald-500/10", darkText: "dark:text-emerald-400", gradient: "from-emerald-400 to-emerald-600" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_COLORS[category.toLowerCase()] || { bg: "bg-gray-50", text: "text-gray-700", darkBg: "dark:bg-gray-500/10", darkText: "dark:text-gray-400", gradient: "from-gray-400 to-gray-600" };
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const catStyle = getCategoryStyle(post.category);

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-2xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-500 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800">
        {/* Gradient top bar */}
        <div className={`h-1.5 bg-gradient-to-r ${catStyle.gradient}`} />

        <div className="p-8">
          <div className="flex items-center gap-3 mb-5">
            <Link
              href={`/categories/${post.category.toLowerCase()}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg ${catStyle.bg} ${catStyle.text} ${catStyle.darkBg} ${catStyle.darkText} transition-colors hover:opacity-80`}
            >
              {post.category}
            </Link>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {formatDate(post.date)}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              &middot; {post.readingTime}
            </span>
          </div>

          <Link href={`/blog/${post.slug}`}>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
              {post.title}
            </h2>
          </Link>

          <p className="text-base text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed">
            {post.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-sm font-bold text-white">
                  {post.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.author}
                </p>
              </div>
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2.5 transition-all"
            >
              Đọc thêm
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-md dark:text-gray-400 dark:bg-gray-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-200 transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800">
      {/* Category gradient top bar */}
      <div className={`h-1 bg-gradient-to-r ${catStyle.gradient}`} />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/categories/${post.category.toLowerCase()}`}
            className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-md ${catStyle.bg} ${catStyle.text} ${catStyle.darkBg} ${catStyle.darkText} transition-colors hover:opacity-80`}
          >
            {post.category}
          </Link>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {formatDate(post.date)}
          </span>
        </div>

        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h2>
        </Link>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
          {post.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {post.author.charAt(0)}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {post.author}
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {post.readingTime}
          </span>
        </div>
      </div>
    </article>
  );
}
