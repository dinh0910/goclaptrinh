import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostSlugs, getPostBySlug, getAllPosts, getPostIdBySlug } from "@/lib/posts";
import { siteConfig, DEFAULT_CATEGORY_ICON } from "@/lib/constants";
import { getCategoryBySlug } from "@/lib/categories";
import { getSeriesById, getSeriesPostsById } from "@/lib/series";
import { categoryColor } from "@/lib/categoryColors";
import { sanitizePostHtml } from "@/lib/sanitize";
import { listPublicComments } from "@/lib/comments";
import { getReactionCounts } from "@/lib/reactions";
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

  let seriesMeta: { name: string; slug: string; icon: string; order: number; total: number; prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null } | null = null;
  if (post.seriesId) {
    const s = getSeriesById(post.seriesId);
    if (s) {
      const posts = getSeriesPostsById(s.id, { publishedOnly: true });
      const idx = posts.findIndex((p) => p.slug === slug);
      seriesMeta = {
        name: s.name,
        slug: s.slug,
        icon: s.icon || "📚",
        order: (post.seriesOrder ?? 0) + 1,
        total: posts.length,
        prev: idx < posts.length - 1 ? { slug: posts[idx + 1].slug, title: posts[idx + 1].title } : null,
        next: idx > 0 ? { slug: posts[idx - 1].slug, title: posts[idx - 1].title } : null,
      };
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className={`relative overflow-hidden ${catMeta.bg} ${catMeta.darkBg}`}>
        <div className="absolute inset-0">
          <div className={`absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br ${catMeta.gradient} opacity-10 blur-[120px]`} />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {/* Breadcrumb */}
          <nav className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
              <li>
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Trang chủ</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Blog</Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/categories/${post.category.toLowerCase()}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{post.categoryName || post.category}</Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

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

        {/* Series navigation */}
        {seriesMeta && (
          <div className="mb-12 rounded-2xl border border-gray-200 bg-violet-50/50 dark:border-gray-800 dark:bg-violet-500/5 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-lg shadow-md shadow-violet-500/20">
                {seriesMeta.icon}
              </span>
              <div>
                <Link href={`/series/${seriesMeta.slug}`} className="text-sm font-bold text-violet-700 dark:text-violet-300 hover:underline">
                  {seriesMeta.name}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bài {seriesMeta.order} trong {seriesMeta.total} bài
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {seriesMeta.prev ? (
                <Link href={`/blog/${seriesMeta.prev.slug}`} className="group flex items-start gap-2 rounded-xl bg-white border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all p-3 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-violet-800">
                  <span className="text-gray-300 dark:text-gray-600 text-lg mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase">Bài trước</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-2 transition-colors">{seriesMeta.prev.title}</p>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {seriesMeta.next ? (
                <Link href={`/blog/${seriesMeta.next.slug}`} className="group flex items-start gap-2 rounded-xl bg-white border border-gray-200 hover:border-violet-200 hover:shadow-md transition-all p-3 text-right dark:bg-gray-900 dark:border-gray-800 dark:hover:border-violet-800">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase">Bài tiếp theo</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-2 transition-colors">{seriesMeta.next.title}</p>
                  </div>
                  <span className="text-gray-300 dark:text-gray-600 text-lg mt-0.5">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ) : (
                <div />
              )}
            </div>
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
