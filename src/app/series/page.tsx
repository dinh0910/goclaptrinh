import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getSeriesWithCounts } from "@/lib/series";

export const metadata: Metadata = {
  title: `Series | ${siteConfig.name}`,
  description: `Các chuỗi bài viết về lập trình và CNTT trên ${siteConfig.name}`,
  alternates: {
    canonical: `${siteConfig.url}/series`,
  },
};

export default async function SeriesPage() {
  const series = getSeriesWithCounts();

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-violet-50/50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-[100px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <nav className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Trang chủ
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white font-medium">Series</li>
            </ol>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Series
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Các chuỗi bài viết cùng chủ đề, xếp theo thứ tự học từ cơ bản đến nâng cao.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {series.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">📚</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">
              Chưa có series nào
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Hãy quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {series
              .filter((s) => s.count > 0)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/series/${s.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 hover:shadow-xl hover:shadow-violet-500/5 hover:border-violet-200 transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-violet-800 p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-2xl shadow-md shadow-violet-500/20">
                      {s.icon || "📚"}
                    </span>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      {s.count} bài
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                    {s.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {s.description || "Chuỗi bài viết cùng chủ đề."}
                  </p>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}