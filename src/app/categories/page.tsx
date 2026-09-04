import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig, DEFAULT_CATEGORY_ICON } from "@/lib/constants";
import { getCategoriesWithCounts } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Danh mục",
  description: `Tất cả danh mục bài viết về lập trình trên ${siteConfig.name}. JavaScript, TypeScript, React, Next.js, Node.js, Python, DevOps và nhiều hơn nữa.`,
  openGraph: {
    title: `Danh mục | ${siteConfig.name}`,
    description: `Tất cả danh mục bài viết về lập trình`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/categories`,
  },
};

const CATEGORY_META: Record<string, { gradient: string; bg: string; darkBg: string }> = {
  javascript: { gradient: "from-yellow-400 to-orange-400", bg: "bg-yellow-50", darkBg: "dark:bg-yellow-500/5" },
  typescript: { gradient: "from-blue-400 to-blue-600", bg: "bg-blue-50", darkBg: "dark:bg-blue-500/5" },
  react: { gradient: "from-cyan-400 to-cyan-600", bg: "bg-cyan-50", darkBg: "dark:bg-cyan-500/5" },
  nextjs: { gradient: "from-gray-400 to-gray-600", bg: "bg-gray-100", darkBg: "dark:bg-gray-200/5" },
  nodejs: { gradient: "from-green-400 to-green-600", bg: "bg-green-50", darkBg: "dark:bg-green-500/5" },
  python: { gradient: "from-sky-400 to-sky-600", bg: "bg-sky-50", darkBg: "dark:bg-sky-500/5" },
  devops: { gradient: "from-purple-400 to-purple-600", bg: "bg-purple-50", darkBg: "dark:bg-purple-500/5" },
  "co-ban": { gradient: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/5" },
};

export default function CategoriesPage() {
  const categories = getCategoriesWithCounts().map((cat) => ({
    ...cat,
    icon: cat.icon || DEFAULT_CATEGORY_ICON,
    meta: CATEGORY_META[cat.slug] || { gradient: "from-gray-400 to-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-gray-500/5" },
  }));

  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-violet-50/50 to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[80px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
            Danh mục
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
            Khám phá {totalCount} bài viết được phân loại theo {categories.length} chủ đề
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className={`group relative overflow-hidden rounded-2xl ${cat.meta.bg} ${cat.meta.darkBg} border border-gray-200/60 dark:border-gray-800 hover:shadow-xl hover:shadow-blue-500/5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300`}
            >
              {/* Gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cat.meta.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
<div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.meta.gradient} flex items-center justify-center text-2xl shadow-lg`}>
    {cat.icon}
  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{cat.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">bài viết</p>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1.5">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {cat.description}
                </p>

                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem bài viết
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
