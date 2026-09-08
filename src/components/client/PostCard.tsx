import Link from "next/link";
import { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { categoryColor } from "@/lib/categoryColors";

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const catStyle = categoryColor(post.categoryColor || post.category);

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
              {post.categoryName || post.category}
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
            {post.categoryName || post.category}
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
