import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostSlugs, getPostBySlug, getAllPosts, getPostIdBySlug } from "@/lib/posts";
import { siteConfig, DEFAULT_CATEGORY_ICON } from "@/lib/constants";
import { getCategoryBySlug } from "@/lib/categories";
import { categoryColor } from "@/lib/categoryColors";
import { sanitizePostHtml } from "@/lib/sanitize";
import { listPublicComments } from "@/lib/comments";
import { getReactionCounts } from "@/lib/reactions";
import Breadcrumb from "@/components/shared/Breadcrumb";
import PostContent from "@/components/client/PostContent";
import PostCard from "@/components/client/PostCard";
import BlogComments from "@/components/client/BlogComments";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostBySlug(slug);

    return {
      title: post.title,
      description: post.description,
      keywords: [post.category, ...post.tags],
      openGraph: {
        title: post.title,
        description: post.description,
        type: "article",
        publishedTime: post.date,
        authors: [post.author],
        tags: post.tags,
        images: [
          {
            url: post.image || "/opengraph-image",
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.description,
        images: [post.image || "/opengraph-image"],
      },
      alternates: {
        canonical: `${siteConfig.url}/blog/${slug}`,
      },
    };
  } catch {
    return { title: "Not Found" };
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  let post;
  try {
    post = await getPostBySlug(slug);
  } catch {
    notFound();
  }

  post.content = sanitizePostHtml(post.content);

  const postId = getPostIdBySlug(slug);
  const initialComments = postId ? listPublicComments(postId) : [];
  const { like: initialLikeCount } = postId ? getReactionCounts(postId) : { like: 0 };

  const allPosts = await getAllPosts();
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;

  // Related posts: same category, excluding current
  const relatedPosts = allPosts
    .filter((p) => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  const catMeta = categoryColor(post.categoryColor || post.category.toLowerCase());
  const catIcon = getCategoryBySlug(post.category)?.icon || DEFAULT_CATEGORY_ICON;

  return (
    <div>
      {/* Hero */}
      <section className={`relative overflow-hidden ${catMeta.bg} ${catMeta.darkBg}`}>
        <div className="absolute inset-0">
          <div className={`absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br ${catMeta.gradient} opacity-10 blur-[120px]`} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Breadcrumb */}
          <Breadcrumb
            className="mb-6"
            itemClassName="truncate max-w-[200px]"
            items={[
              { label: "Trang chủ", href: "/" },
              { label: "Blog", href: "/blog" },
              {
                label: post.categoryName || post.category,
                href: `/categories/${post.category.toLowerCase()}`,
              },
              { label: post.title },
            ]}
          />

          {/* Mini info bar */}
          <div className="flex items-center gap-4">
            <Link
              href={`/categories/${post.category.toLowerCase()}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${catMeta.bg} text-gray-700 ${catMeta.darkBg} dark:text-gray-300 transition-opacity hover:opacity-80`}
            >
              <span>{catIcon}</span>
              {post.categoryName || post.category}
            </Link>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <time>{post.readingTime}</time>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <PostContent post={post} />
        {postId && (
          <BlogComments
            slug={slug}
            initialComments={initialComments}
            initialLikeCount={initialLikeCount}
          />
        )}
      </div>

      {/* Prev/Next + Related */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        {/* Prev / Next */}
        {(prevPost || nextPost) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {prevPost && (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800"
              >
                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-wider">Bài trước</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors">
                  {prevPost.title}
                </p>
              </Link>
            )}
            {nextPost && (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group p-5 bg-white rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 text-right dark:bg-gray-900 dark:border-gray-800 dark:hover:border-blue-800"
              >
                <div className="flex items-center justify-end gap-2 text-gray-400 dark:text-gray-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Bài tiếp theo</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2 transition-colors">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-1 h-6 rounded-full bg-gradient-to-b ${catMeta.gradient}`} />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bài viết liên quan</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedPosts.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
