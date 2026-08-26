import type { Metadata } from "next";
import { getAllTags } from "@/lib/posts";
import { siteConfig } from "@/lib/constants";
import TagCloud from "@/components/client/TagCloud";

export const metadata: Metadata = {
  title: "Tags",
  description: `Tất cả tags trên ${siteConfig.name}. Tìm bài viết theo từ khóa.`,
  openGraph: {
    title: `Tags | ${siteConfig.name}`,
    description: `Tất cả tags trên ${siteConfig.name}`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/tags`,
  },
};

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Tags
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Tìm bài viết theo từ khóa
        </p>
      </div>

      {Object.keys(tags).length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            Chưa có tag nào.
          </p>
        </div>
      ) : (
        <TagCloud tags={tags} />
      )}
    </div>
  );
}
