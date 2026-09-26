import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/constants";
import { getPolicyBySlug, getPublishedPolicies } from "@/lib/policy";
import { sanitizePostHtml } from "@/lib/sanitize";
import CodeBlockCopy from "@/components/client/blog/CodeBlockCopy";

export const dynamic = "force-dynamic";

interface PolicyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug, { publishedOnly: true });
  if (!policy) return { title: "Không tìm thấy văn bản" };

  return {
    title: policy.title,
    description: policy.summary || `${policy.title} của ${siteConfig.name}.`,
    alternates: {
      canonical: `${siteConfig.url}/chinh-sach/${policy.slug}`,
    },
    openGraph: {
      title: `${policy.title} | ${siteConfig.name}`,
      description: policy.summary || policy.title,
      type: "article",
    },
  };
}

export default async function PolicyDetailPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = getPolicyBySlug(slug, { publishedOnly: true });
  // Bản nháp phải trả 404 chứ không phải 200, để không lộ nội dung chưa duyệt.
  if (!policy) notFound();

  const others = getPublishedPolicies().filter((p) => p.slug !== policy.slug);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/chinh-sach"
          className="text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
        >
          &larr; Tất cả chính sách
        </Link>
      </nav>

      <article>
        <header className="mb-10 pb-8 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {policy.title}
          </h1>
          {policy.updatedAt && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Cập nhật lần cuối:{" "}
              {new Date(policy.updatedAt).toLocaleDateString("vi-VN")}
            </p>
          )}
        </header>

        {policy.content ? (
          // Nội dung do admin soạn trong RichEditor — sanitize lúc hiển thị vì
          // HTML nằm trong bảng settings, không đi qua pipeline của bài viết.
          <CodeBlockCopy>
            <div
              className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-code:text-blue-600 prose-pre:bg-gray-900 prose-pre:text-gray-100 dark:prose-invert dark:prose-headings:text-white dark:prose-p:text-gray-300 dark:prose-a:text-blue-400 dark:prose-strong:text-white dark:prose-ul:text-gray-300 dark:prose-ol:text-gray-300 dark:prose-li:text-gray-300 dark:prose-code:text-blue-400 dark:prose-pre:bg-gray-800"
              dangerouslySetInnerHTML={{ __html: sanitizePostHtml(policy.content) }}
            />
          </CodeBlockCopy>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Nội dung đang được cập nhật.
          </p>
        )}
      </article>

      {others.length > 0 && (
        <section className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Văn bản khác
          </h2>
          <ul className="space-y-2">
            {others.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/chinh-sach/${p.slug}`}
                  className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
