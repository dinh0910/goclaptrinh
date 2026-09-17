"use client";

import Link from "next/link";
import PostActions from "./PostActions";
import DataTable from "@/components/admin/ui/DataTable";
import { formatDateTime } from "@/lib/utils";

export interface AdminPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  tags: string[];
  featured?: boolean;
  published?: boolean;
  publishedAt?: string;
}

function publishStatus(post: AdminPost): { label: string; cls: string } {
  if (!post.published) {
    return { label: "Nháp", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  }
  if (post.publishedAt && new Date(post.publishedAt).getTime() > Date.now()) {
    return { label: "Hẹn giờ", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" };
  }
  return { label: "Đã đăng", cls: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400" };
}

export default function PostTable({
  posts,
  categoryName,
}: {
  posts: AdminPost[];
  categoryName: Record<string, string>;
}) {
  return (
    <DataTable<AdminPost>
      columns={[
        { label: "Tiêu đề", sortKey: "title" },
        { label: "Danh mục", sortKey: "category" },
        { label: "Ngày", sortKey: "date" },
        { label: "Tags", sortKey: "tags" },
        { label: "Trạng thái", sortKey: "published" },
        { label: "Featured", sortKey: "featured" },
        { label: "", align: "right" },
      ]}
      rows={posts}
      rowKey={(p) => p.slug}
      getSortValue={(key, p) => {
        switch (key) {
          case "title":
            return p.title;
          case "category":
            return p.category;
          case "date":
            return p.date;
          case "tags":
            return p.tags.length;
          case "featured":
            return p.featured ? 1 : 0;
          case "published":
            return publishStatus(p).label;
          default:
            return "";
        }
      }}
      searchKeys={[
        (p) => p.title,
        (p) => p.category,
        (p) => p.tags.join(" "),
      ]}
      searchPlaceholder="Tìm theo tiêu đề, danh mục, tag..."
      toolbar={
        <Link
          href="/admin/posts/new"
          className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Viết mới
        </Link>
      }
      emptyIcon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M7 15h4" />
        </svg>
      }
      emptyText="Chưa có bài viết nào."
      emptyHint="Hãy viết bài viết đầu tiên để bắt đầu."
      renderRow={(post) => (
        <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
          <td className="p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.title}</p>
          </td>
          <td className="p-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">{categoryName[post.category] || post.category}</span>
          </td>
          <td className="p-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDateTime(post.date)}
            </span>
          </td>
          <td className="p-4">
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                  {tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="text-[10px] px-1.5 py-0.5 text-gray-400 dark:text-gray-500">
                  +{post.tags.length - 2}
                </span>
              )}
            </div>
          </td>
          <td className="p-4">
            {(() => {
              const s = publishStatus(post);
              return (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${s.cls}`}
                  title={post.publishedAt ? `Từ ${formatDateTime(post.publishedAt)}` : undefined}
                >
                  {s.label}
                </span>
              );
            })()}
          </td>
          <td className="p-4">
            {post.featured ? (
              <span className="inline-flex items-center justify-center w-6 h-6 text-amber-600 dark:text-amber-400" title="Featured">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden>
                  <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.64 1.12 6.53L12 17.77l-5.87 3.09 1.12-6.53L2.5 9.27l6.6-1.01Z" />
                </svg>
              </span>
            ) : (
              <span className="text-gray-300 dark:text-gray-600">—</span>
            )}
          </td>
          <td className="p-4">
            <PostActions slug={post.slug} />
          </td>
        </tr>
      )}
    />
  );
}