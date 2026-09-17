"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import Breadcrumb from "@/components/shared/Breadcrumb";
import FieldNumber from "@/components/admin/ui/FieldNumber";
import RichEditor from "@/components/admin/editor/RichEditor";
import type { AdminLesson } from "./LessonsManager";

interface LessonFormProps {
  mode: "create" | "edit";
  courseId: number;
  courseSlug: string;
  courseTitle: string;
  initialData?: Partial<AdminLesson>;
}

type DurationUnit = "phút" | "giờ";

function parseDuration(text: string): { value: number; unit: DurationUnit } {
  const m = text.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(giờ|h|phút|min)\b/);
  if (!m) return { value: 0, unit: "phút" };
  return m[2] === "phút" || m[2] === "min"
    ? { value: Number(m[1]), unit: "phút" }
    : { value: Number(m[1]), unit: "giờ" };
}

const fieldClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

export default function LessonForm({
  mode,
  courseId,
  courseSlug,
  courseTitle,
  initialData,
}: LessonFormProps) {
  const router = useRouter();
  const initialDuration = parseDuration(initialData?.duration ?? "");

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    content: initialData?.content ?? "",
    videoUrl: initialData?.videoUrl ?? "",
    duration: initialDuration.value,
    durationUnit: initialDuration.unit,
    published: initialData?.published ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const listHref = `/admin/courses/${courseSlug}/lessons`;
  const editHref = (slug: string) => `${listHref}/${slug}/edit`;

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Tiêu đề bài học là bắt buộc");
      return;
    }
    setSaving(true);
    try {
      const url =
        mode === "edit"
          ? `/api/admin/courses/${courseId}/lessons/${initialData?.id}`
          : `/api/admin/courses/${courseId}/lessons`;
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          content: form.content,
          videoUrl: form.videoUrl,
          published: form.published,
          duration:
            form.duration > 0 ? `${form.duration} ${form.durationUnit}` : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(mode === "edit" ? "Đã lưu thay đổi" : "Đã thêm bài học");
      if (mode === "edit") {
        if (data?.slug && data.slug !== initialData?.slug) {
          document.dispatchEvent(new CustomEvent("admin:navigation"));
          router.replace(editHref(data.slug));
        }
      } else if (data?.slug) {
        document.dispatchEvent(new CustomEvent("admin:navigation"));
        router.replace(editHref(data.slug));
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (mode !== "edit" || !initialData?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/courses/${courseId}/lessons/${initialData.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Đã xóa bài học");
      document.dispatchEvent(new CustomEvent("admin:navigation"));
      router.push(listHref);
      router.refresh();
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
          { label: "Bài học", href: listHref },
          { label: mode === "edit" ? "Chỉnh sửa bài học" : "Thêm bài học" },
        ]}
      />
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={listHref}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors shrink-0"
          >
            ← Bài học
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {mode === "edit" ? `Chỉnh sửa: ${form.title || ""}` : "Thêm bài học mới"}
          </h1>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {saving ? "Đang lưu..." : mode === "edit" ? "Lưu thay đổi" : "+ Thêm bài học"}
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Khóa học: <span className="font-medium text-gray-700 dark:text-gray-200">{courseTitle}</span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Main content */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Tiêu đề bài học *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className={fieldClass}
                  placeholder="VD: Giới thiệu React"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  URL video (YouTube/self-hosted)
                </label>
                <input
                  type="text"
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  className={fieldClass}
                  placeholder="https://youtube.com/..."
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Điền URL video hoặc để trống để viết nội dung dạng text.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nội dung bài học
                </label>
                <RichEditor
                  content={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Soạn thảo giống bài viết. Có thể chèn video YouTube/TikTok qua nút video.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Thời lượng
              </label>
              <div className="flex gap-2">
                <FieldNumber
                  value={form.duration}
                  onChange={(v) => setForm((f) => ({ ...f, duration: v }))}
                  min={0}
                  step={1}
                  size="sm"
                  className="flex-1 rounded-lg"
                />
                <div className="flex shrink-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 p-0.5">
                  {(["phút", "giờ"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, durationUnit: u }))}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                        form.durationUnit === u
                          ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                      }`}
                    >
                      {u === "phút" ? "Phút" : "Giờ"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Trạng thái
              </label>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.published}
                  onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    form.published
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      form.published ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {form.published ? "Hiển thị" : "Ẩn"}
                </span>
              </div>
            </div>
          </div>

          {mode === "edit" && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-500/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              Xóa bài học
            </button>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          open={true}
          title="Xóa bài học"
          message={`Bạn có chắc muốn xóa bài học "${form.title}" không? Hành động này không thể hoàn tác.`}
          confirmLabel="Xóa"
          cancelLabel="Hủy"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}