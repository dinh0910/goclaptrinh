import Link from "next/link";
import { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/constants";

interface PostContentProps {
  post: Post;
}

const CATEGORY_COLORS: Record<string, { gradient: string; bg: string; darkBg: string; text: string; darkText: string }> = {
  javascript: { gradient: "from-yellow-400 to-orange-400", bg: "bg-yellow-50", darkBg: "dark:bg-yellow-500/10", text: "text-yellow-700", darkText: "dark:text-yellow-400" },
  typescript: { gradient: "from-blue-400 to-blue-600", bg: "bg-blue-50", darkBg: "dark:bg-blue-500/10", text: "text-blue-700", darkText: "dark:text-blue-400" },
  react: { gradient: "from-cyan-400 to-cyan-600", bg: "bg-cyan-50", darkBg: "dark:bg-cyan-500/10", text: "text-cyan-700", darkText: "dark:text-cyan-400" },
  nextjs: { gradient: "from-gray-400 to-gray-600", bg: "bg-gray-100", darkBg: "dark:bg-gray-200/10", text: "text-gray-700", darkText: "dark:text-gray-300" },
  nodejs: { gradient: "from-green-400 to-green-600", bg: "bg-green-50", darkBg: "dark:bg-green-500/10", text: "text-green-700", darkText: "dark:text-green-400" },
  python: { gradient: "from-sky-400 to-sky-600", bg: "bg-sky-50", darkBg: "dark:bg-sky-500/10", text: "text-sky-700", darkText: "dark:text-sky-400" },
  devops: { gradient: "from-purple-400 to-purple-600", bg: "bg-purple-50", darkBg: "dark:bg-purple-500/10", text: "text-purple-700", darkText: "dark:text-purple-400" },
  "co-ban": { gradient: "from-emerald-400 to-emerald-600", bg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/10", text: "text-emerald-700", darkText: "dark:text-emerald-400" },
};

function getCatStyle(category: string) {
  return CATEGORY_COLORS[category.toLowerCase()] || { gradient: "from-gray-400 to-gray-600", bg: "bg-gray-50", darkBg: "dark:bg-gray-500/10", text: "text-gray-700", darkText: "dark:text-gray-400" };
}

export default function PostContent({ post }: PostContentProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    url: `${siteConfig.url}/blog/${post.slug}`,
    image: post.image || `${siteConfig.url}/opengraph-image`,
    author: {
      "@type": "Organization",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Trang chủ",
        item: siteConfig.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteConfig.url}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.category,
        item: `${siteConfig.url}/categories/${post.category.toLowerCase()}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.title,
        item: `${siteConfig.url}/blog/${post.slug}`,
      },
    ],
  };

  const catStyle = getCatStyle(post.category);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <article>
        {/* Header */}
        <header className="mb-10">
          {/* Category + Meta Row */}
          <div className="flex items-center gap-3 mb-5">
            <Link
              href={`/categories/${post.category.toLowerCase()}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg ${catStyle.bg} ${catStyle.text} ${catStyle.darkBg} ${catStyle.darkText} transition-opacity hover:opacity-80`}
            >
              {post.category}
            </Link>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-bold text-gray-900 dark:text-white leading-[1.2] tracking-tight">
            {post.title}
          </h1>

          {/* Description */}
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-3xl">
            {post.description}
          </p>

          {/* Author + Actions */}
          <div className="flex items-center justify-between mt-8 pb-8 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-sm font-bold text-white">
                  {post.author.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.author}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Đăng ngày {formatDate(post.date)}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-blue-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-a:text-blue-400 dark:prose-strong:text-white dark:prose-code:text-blue-400 dark:prose-pre:bg-gray-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio */}
        <div className="mt-10 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <span className="text-lg font-bold text-white">
                {post.author.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900 dark:text-white">{post.author}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Tác giả tại {siteConfig.name} — chia sẻ kiến thức lập trình và công nghệ thông tin.
              </p>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
