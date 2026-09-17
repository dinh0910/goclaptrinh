"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { CourseLevel } from "@/lib/types";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import RowActionsMenu from "@/components/admin/ui/RowActionsMenu";
import DataTable from "@/components/admin/ui/DataTable";
import { categoryColor } from "@/lib/categoryColors";

export interface AdminCourse {
  id: number;
  slug: string;
  title: string;
  level: string;
  price: number;
  category: string;
  featured: boolean;
  published: boolean;
  lessonCount?: number;
}

export default function CourseTable({
  courses,
  levels = [],
}: {
  courses: AdminCourse[];
  levels?: CourseLevel[];
}) {
  const levelMap: Record<string, CourseLevel> = {};
  for (const l of levels) levelMap[l.key] = l;
  const levelLabels = Object.fromEntries(levels.map((l) => [l.key, l.label]));

  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/courses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Không thể xóa khóa học");
        return;
      }
      window.location.reload();
      toast.success("Đã xóa khóa học");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <DataTable<AdminCourse>
        columns={[
          { label: "Tên", sortKey: "title" },
          { label: "Danh mục", sortKey: "category" },
          { label: "Cấp độ", sortKey: "level" },
          { label: "Giá", sortKey: "price" },
          { label: "Bài học", sortKey: "lessonCount" },
          { label: "Trạng thái", sortKey: "published" },
          { label: "", align: "right" },
        ]}
        rows={courses}
        rowKey={(c) => c.id}
        getSortValue={(key, c) => {
          switch (key) {
            case "title":
              return c.title;
            case "category":
              return c.category;
            case "level":
              return levelLabels[c.level] || c.level;
            case "price":
              return c.price;
            case "lessonCount":
              return c.lessonCount ?? 0;
            case "featured":
              return c.featured ? 1 : 0;
            case "published":
              return c.published ? 1 : 0;
            default:
              return "";
          }
        }}
        searchKeys={[(c) => c.title, (c) => c.slug, (c) => c.category]}
        searchPlaceholder="Tìm theo tiêu đề, slug, danh mục..."
        toolbar={
          <Link
            href="/admin/courses/new"
            className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Thêm mới
          </Link>
        }
        emptyIcon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        }
        emptyText="Chưa có khóa học nào."
        emptyHint="Hãy tạo khóa học đầu tiên để bắt đầu."
        renderRow={(course) => (
          <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{course.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{course.slug}</p>
              {course.featured && (
                <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3" aria-hidden>
                    <path d="M12 2l2.9 6.26L21.5 9.27l-4.75 4.64 1.12 6.53L12 17.77l-5.87 3.09 1.12-6.53L2.5 9.27l6.6-1.01Z" />
                  </svg>
                  Nổi bật
                </span>
              )}
            </td>
            <td className="p-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">{course.category || "—"}</span>
            </td>
            <td className="p-4">
              {(() => {
                const level = levelMap[course.level];
                if (!level) {
                  return (
                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {course.level}
                    </span>
                  );
                }
                const color = categoryColor(level.color);
                return (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${color.bg} ${color.text}`}>
                    {level.icon} {level.label}
                  </span>
                );
              })()}
            </td>
            <td className="p-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {course.price > 0
                  ? course.price.toLocaleString("vi-VN") + "đ"
                  : "Miễn phí"}
              </span>
            </td>
            <td className="p-4">
              <span className="inline-flex items-center justify-center min-w-6 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                {course.lessonCount ?? 0}
              </span>
            </td>
            <td className="p-4">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                  course.published
                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {course.published ? "Đã đăng" : "Nháp"}
              </span>
            </td>
            <td className="p-4">
              <div className="flex items-center justify-end">
                <RowActionsMenu
                  actions={[
                    {
                      label: "Bài học",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                        </svg>
                      ),
                      onClick: () => {
                        window.location.href = `/admin/courses/${course.slug}/lessons`;
                      },
                    },
                    {
                      label: "Sửa",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      ),
                      onClick: () => {
                        window.location.href = `/admin/courses/${course.slug}/edit`;
                      },
                    },
                    {
                      label: "Xem trang công khai",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ),
                      onClick: () => {
                        window.open(`/courses/${course.slug}`, "_blank");
                      },
                    },
                    {
                      label: "Xóa",
                      variant: "danger",
                      icon: (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden>
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                        </svg>
                      ),
                      onClick: () => setDeleteTarget(course),
                    },
                  ]}
                />
              </div>
            </td>
          </tr>
        )}
      />

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Xóa khóa học"
          message={`Bạn có chắc muốn xóa khóa học "${deleteTarget.title}" không? Toàn bộ bài học trong khóa sẽ bị xóa. Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}