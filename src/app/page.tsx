import Link from "next/link";
import { getAllPosts, getAllCategories } from "@/lib/posts";
import { CATEGORIES, siteConfig } from "@/lib/constants";
import PostCard from "@/components/client/PostCard";
import CategoryList from "@/components/client/CategoryList";
import HeroBanner from "@/components/client/HeroBanner";

export default async function Home() {
  const posts = await getAllPosts();
  const featuredPosts = posts.filter((post) => post.featured);
  const latestPosts = posts.slice(0, 6);
  const categoryCounts = getAllCategories();

  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    count: categoryCounts[cat.slug] || 0,
  })).filter((cat) => cat.count > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HeroBanner />

      {/* Ad Banner Top - Responsive Banner 728x90 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-xs font-semibold uppercase tracking-wider">Quảng cáo</p>
              <p className="text-[10px] mt-0.5">728 x 90 px (Leaderboard)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bài viết nổi bật
            </h2>
            <Link
              href="/blog"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Xem tất cả &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Ad Inline - Rectangle 300x250 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-center">
          <div className="w-full max-w-[300px] h-[250px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-xs font-semibold uppercase tracking-wider">Quảng cáo</p>
              <p className="text-[10px] mt-0.5">300 x 250 px (Medium Rectangle)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Danh mục
          </h2>
          <CategoryList categories={categories} />
        </section>
      )}

      {/* Main Content + Sidebar Layout */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          {/* Main Content */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Bài viết mới nhất
              </h2>
              <Link
                href="/blog"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Xem tất cả &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {latestPosts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Sidebar Ad - 300x600 */}
            <div className="sticky top-20">
              <div className="w-full h-[600px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wider">Quảng cáo</p>
                  <p className="text-[10px] mt-0.5">300 x 600 px (Half Page)</p>
                </div>
              </div>

              {/* Sidebar Ad 2 - 300x250 */}
              <div className="w-full h-[250px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700 mt-6">
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <p className="text-xs font-semibold uppercase tracking-wider">Quảng cáo</p>
                  <p className="text-[10px] mt-0.5">300 x 250 px (Medium Rectangle)</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Đăng ký nhận bài viết mới
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              Nhận thông báo khi có bài viết mới về lập trình và CNTT.
              Không spam, chỉ nội dung chất lượng.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="email@example.com"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button type="button" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner Bottom - Responsive 728x90 */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-xs font-semibold uppercase tracking-wider">Quảng cáo</p>
              <p className="text-[10px] mt-0.5">728 x 90 px (Leaderboard)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Banner Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <h2 className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6 dark:text-gray-500">
          Đối tác &amp; Tài trợ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="text-center text-gray-400 dark:text-gray-500">
                <p className="text-[10px] font-semibold uppercase">Logo #{i}</p>
                <p className="text-[9px]">192 x 80 px</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
