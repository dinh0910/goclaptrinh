"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Breadcrumb from "@/components/shared/Breadcrumb";

export interface AdminLesson {
  id: number;
  courseId: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  videoUrl: string;
  orderIndex: number;
  duration: string;
  published: boolean;
}

interface LessonsManagerProps {
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  initialLessons: AdminLesson[];
}

export default function LessonsManager({
  courseId,
  courseSlug,
  courseTitle,
  initialLessons,
}: LessonsManagerProps) {
  const router = useRouter();
  const [lessons, setLessons] = useState<AdminLesson[]>(initialLessons);
  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => router.refresh();
  const listHref = `/admin/courses/${courseSlug}/lessons`;

  const moveLesson = async (lesson: AdminLesson, dir: -1 | 1) => {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    const target = lessons[idx + dir];
    if (!target) return;
    const next = [...lessons];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    next.forEach((l, i) => {
      l.orderIndex = i;
    });
    setLessons(next);
    try {
      await Promise.all([
        fetch(`/api/admin/courses/${courseId}/lessons/${lesson.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: next[idx].orderIndex }),
        }),
        fetch(`/api/admin/courses/${courseId}/lessons/${target.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: next[idx + dir].orderIndex }),
        }),
      ]);
    } catch {
      toast.error("Không thể thay đổi thứ tự");
      refresh();
    }
  };

  const togglePublish = async (lesson: AdminLesson) => {
    setLessons((prev) =>
      prev.map((l) => (l.id === lesson.id ? { ...l, published: !l.published } : l))
    );
    try {
      await fetch(`/api/admin/courses/${courseId}/lessons/${lesson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !lesson.published }),
      });
    } catch {
      toast.error("Không thể cập nhật trạng thái");
      refresh();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/lessons/${deleteTarget.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã xóa bài học");
      setLessons((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Khóa học", href: "/admin/courses" },
          { label: courseTitle, href: `/admin/courses/${courseSlug}/edit` },
          { label: "Bài học" },
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/courses"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            ← Danh sách
          </Link>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            Bài học · {courseTitle}
          </h1>
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
            {lessons.length}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/admin/courses/${courseSlug}/edit`}
            className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            Sửa khóa học
          </Link>
          <Link
            href={`${listHref}/new`}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Thêm bài học
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {lessons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-300 dark:text-gray-600" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chưa có bài học nào.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Bấm &quot;+ Thêm bài học&quot; để tạo bài học đầu tiên.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {lessons.map((lesson, idx) => (
              <li
                key={lesson.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveLesson(lesson, -1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default dark:hover:text-gray-200 p-0.5"
                    aria-label="Lên"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={idx === lessons.length - 1}
                    onClick={() => moveLesson(lesson, 1)}
                    className="text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-default dark:hover:text-gray-200 p-0.5"
                    aria-label="Xuống"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>

                <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {idx + 1}
                </span>

                <Link
                  href={`${listHref}/${lesson.slug}/edit`}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {lesson.duration || "—"} ·{" "}
                    {lesson.videoUrl ? "🎬 Video" : "📄 Text"}
                  </p>
                </Link>

                <button
                  type="button"
                  onClick={() => togglePublish(lesson)}
                  title={lesson.published ? "Đang hiển thị (bấm để ẩn)" : "Đang ẩn (bấm để hiển thị)"}
                  className={`shrink-0 w-2 h-2 rounded-full transition-colors ${
                    lesson.published
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setDeleteTarget(lesson)}
                  className="shrink-0 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors p-1"
                  aria-label="Xóa"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          open={true}
          title="Xóa bài học"
          message={`Bạn có chắc muốn xóa bài học "${deleteTarget.title}" không? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}