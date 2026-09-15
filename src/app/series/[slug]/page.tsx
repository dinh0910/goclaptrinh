import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { getSeriesBySlug, getSeriesWithCounts, getSeriesPosts } from "@/lib/series";
import { getCategoryBySlug } from "@/lib/categories";
import { formatDate } from "@/lib/utils";
import { categoryColor } from "@/lib/categoryColors";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getSeriesWithCounts().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: "Not Found" };

  return {
    title: series.name,
    description: series.description,
    openGraph: {
      title: `${series.name} | ${siteConfig.name}`,
      description: series.description,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/series/${slug}`,
    },
  };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const rows = await getSeriesPosts(slug, { publishedOnly: true });
  const posts = rows.map((row) => {
    const cat = getCategoryBySlug(row.category);
    return {
      slug: row.slug,
      title: row.title,
      description: row.description,
      date: row.date,
      readingTime: row.readingTime,
      category: row.category,
      categoryName: cat?.name ?? row.category,
      categoryColor: cat?.color ?? undefined,
      tags: row.tags,
      author: row.author,
      seriesOrder: row.seriesOrder ?? 0,
      image: row.image ?? undefined,
    };
  });

  const color = categoryColor("violet");

  return (
    <div>
      <section className={`relative overflow-hidden ${color.bg} ${color.darkBg}`}>
        <div className="absolute inset-0">
          <div className={`absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br ${color.gradient} opacity-10 blur-[100px]`} />
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
                <Link href="/series" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  Series
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white font-medium">{series.name}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color.gradient} flex items-center justify-center text-3xl shadow-lg`}>
              {series.icon || "📚"}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                {series.name}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {series.description || "Chuỗi bài viết cùng chủ đề"} &middot; {posts.length} bài
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl">📭</span>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">
              Chưa có bài viết công khai
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Các bài trong series sẽ được cập nhật tại đây.</p>
          </div>
        ) : (
          <ol className="space-y-4">
            {posts.map((post, index) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex items-start gap-4 rounded-xl bg-white border border-gray-200 hover:shadow-lg hover:border-violet-200 transition-all duration-300 p-5 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-violet-800"
                >
                  <span className={`shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${color.gradient} flex items-center justify-center text-sm font-bold text-white shadow-md`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
                      <span>{post.categoryName}</span>
                      <span>&middot;</span>
                      <span>{formatDate(post.date)}</span>
                      <span>&middot;</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}