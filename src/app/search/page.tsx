import type { Metadata } from "next";
import Link from "next/link";
import { searchPosts } from "@/lib/search";
import { siteConfig } from "@/lib/constants";
import PostCard from "@/components/client/blog/PostCard";

export const metadata: Metadata = {
  title: "Tìm kiếm",
  description: `Tìm kiếm bài viết về lập trình trên ${siteConfig.name}.`,
  alternates: {
    canonical: `${siteConfig.url}/search`,
  },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const results = query ? searchPosts(query) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          Tìm kiếm
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-400">
          Tìm kiếm bài viết theo tiêu đề, mô tả, thẻ và nội dung.
        </p>

        <form action="/search" method="get" className="mt-6 flex gap-2 max-w-xl">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Ví dụ: JavaScript, Next.js, React..."
            className="flex-1 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900 dark:bg-gray-900 dark:border-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
          >
            Tìm
          </button>
        </form>
      </div>

      {!query ? (
        <p className="text-gray-500 dark:text-gray-400">
          Nhập từ khóa để tìm kiếm bài viết.
        </p>
      ) : results.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Không tìm thấy kết quả
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Không có bài viết nào khớp với “{query}”. Hãy thử từ khóa khác.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center mt-6 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Xem tất cả bài viết
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Tìm thấy <span className="font-semibold text-gray-900 dark:text-white">{results.length}</span> bài viết cho “{query}”
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
            {results.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}