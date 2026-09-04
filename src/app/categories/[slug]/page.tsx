import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig, DEFAULT_CATEGORY_ICON } from "@/lib/constants";
import { getCategoryBySlug, getCategoriesWithCounts } from "@/lib/categories";
import { getPostsByCategory } from "@/lib/posts";
import PostCard from "@/components/client/PostCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCategoriesWithCounts().map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return { title: "Not Found" };

  return {
    title: category.name,
    description: category.description,
    openGraph: {
      title: `${category.name} | ${siteConfig.name}`,
      description: category.description,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/categories/${slug}`,
    },
  };
}

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

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await getPostsByCategory(category.slug);
  const meta = CATEGORY_META[slug] || { gradient: "from-gray-400 to-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-gray-500/5" };
  const icon = category.icon || DEFAULT_CATEGORY_ICON;

  return (
    <div>
      {/* Hero */}
      <section className={`relative overflow-hidden ${meta.bg} ${meta.darkBg}`}>
        <div className="absolute inset-0">
          <div className={`absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br ${meta.gradient} opacity-10 blur-[100px]`} />
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
              <li>
                <Link href="/categories" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Danh mục
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white font-medium">{category.name}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-3xl shadow-lg`}>
              {icon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {category.name}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {category.description} &middot; {posts.length} bài viết
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Chưa có bài viết</h3>
            <p className="text-gray-500 dark:text-gray-400">Chưa có bài viết nào trong danh mục này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
