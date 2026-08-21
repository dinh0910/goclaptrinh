import type { Metadata } from "next";
import Link from "next/link";
import { getPostsByTag, getAllTags } from "@/lib/posts";
import { siteConfig } from "@/lib/constants";
import PostCard from "@/components/client/PostCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return Object.keys(tags).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `#${slug}`,
    description: `Tất cả bài viết với tag #${slug} trên ${siteConfig.name}`,
    openGraph: {
      title: `#${slug} | ${siteConfig.name}`,
      description: `Tất cả bài viết với tag #${slug}`,
      type: "website",
    },
    alternates: {
      canonical: `${siteConfig.url}/tags/${slug}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const posts = await getPostsByTag(slug);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <nav className="mb-8">
        <ol className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
          <li>
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">
              Trang chủ
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/tags" className="hover:text-blue-600 dark:hover:text-blue-400">
              Tags
            </Link>
          </li>
          <li>/</li>
          <li className="text-gray-900 dark:text-white font-medium">#{slug}</li>
        </ol>
      </nav>

      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tag: #{slug}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {posts.length} bài viết
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            Không có bài viết nào với tag này.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
