import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/constants";
import { getCategoriesWithCounts } from "@/lib/categories";
import PostCard from "@/components/client/PostCard";

export const metadata: Metadata = {
  title: "Blog",
  description: `Tất cả bài viết về lập trình và CNTT trên ${siteConfig.name}. JavaScript, TypeScript, React, Next.js, Node.js, Python và nhiều chủ đề khác.`,
  openGraph: {
    title: `Blog | ${siteConfig.name}`,
    description: `Tất cả bài viết về lập trình và CNTT`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/blog`,
  },
};

const CATEGORY_ICONS: Record<string, string> = {
  javascript: "⚡",
  typescript: "🔷",
  react: "⚛️",
  nextjs: "▲",
  nodejs: "🟢",
  python: "🐍",
  devops: "🔧",
  "co-ban": "📚",
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const categories = getCategoriesWithCounts();
  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div>
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
                Blog
              </h1>
              <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-lg">
                Khám phá {posts.length} bài viết về lập trình và công nghệ thông tin
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{posts.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bài viết</p>
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
        {/* Category Filter Bar */}
        <div className="py-6 -mt-1">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full whitespace-nowrap shadow-sm shadow-blue-600/20"
            >
              Tất cả
              <span className="text-xs opacity-80">({posts.length})</span>
            </Link>
            {categories.map((cat) => {
              const count = posts.filter((p) => p.category.toLowerCase() === cat.slug).length;
              if (count === 0) return null;
              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full whitespace-nowrap transition-colors"
                >
                  <span>{CATEGORY_ICONS[cat.slug] || "📄"}</span>
                  {cat.name}
                  <span className="text-xs opacity-60">({count})</span>
                </Link>
              );
            })}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết</h3>
            <p className="text-gray-500 dark:text-gray-400">Hãy quay lại sau để đọc những bài viết mới nhất!</p>
          </div>
        ) : (
          <div className="pb-16">
            {/* Featured Post - Full Width */}
            {featuredPost && (
              <div className="mb-8">
                <PostCard post={featuredPost} featured />
              </div>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {remainingPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
