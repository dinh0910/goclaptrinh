"use client";

import PostActions from "./PostActions";
import { SearchBar } from "./SearchBar";
import { SortableTh } from "./SortableTh";
import { Pagination } from "./Pagination";
import { useTableControls } from "./useTableControls";
import { formatDateTime } from "@/lib/utils";

export interface AdminPost {
  slug: string;
  title: string;
  category: string;
  date: string;
  tags: string[];
  featured?: boolean;
}

export default function PostTable({
  posts,
  categoryName,
}: {
  posts: AdminPost[];
  categoryName: Record<string, string>;
}) {
  const ctrl = useTableControls<AdminPost>({
    searchKeys: [
      (p) => p.title,
      (p) => p.category,
      (p) => p.tags.join(" "),
    ],
  });

  const { total, totalPages, page, pageItems } = ctrl.process(posts, (key, p) => {
    switch (key) {
      case "title":
        return p.title;
      case "category":
        return p.category;
      case "date":
        return p.date;
      case "tags":
        return p.tags.length;
      default:
        return "";
    }
  });

  return (
    <div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <SearchBar
            value={ctrl.search}
            onChange={ctrl.setSearchAndReset}
            placeholder="Tìm theo tiêu đề, danh mục, tag..."
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <SortableTh label="Tiêu đề" sortKey="title" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <SortableTh label="Danh mục" sortKey="category" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <SortableTh label="Ngày" sortKey="date" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <SortableTh label="Tags" sortKey="tags" currentKey={ctrl.sortKey} dir={ctrl.sortDir} onSort={ctrl.setColumnSort} />
                <th className="px-4 py-3.5 text-right" aria-label="Thao tác" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {pageItems.map((post) => (
                <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.title}</p>
                    {post.featured && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded dark:text-amber-400 dark:bg-amber-500/10">
                        Featured
                      </span>
                    )}
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
                    <PostActions slug={post.slug} />
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Không tìm thấy bài viết nào phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={ctrl.pageSize}
          onPageChange={ctrl.setPage}
          onPageSizeChange={ctrl.setPageSize}
        />
      </div>
    </div>
  );
}
