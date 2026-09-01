"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

export interface MediaItem {
  id: number;
  filename: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  title: string;
  altText: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Cache-busting URL: the file at a given URL can change (e.g. after resize)
// while the path stays the same, so append a version from `updatedAt` to force
// next/image's optimizer and the browser to refetch the updated file.
function mediaSrc(item: { url: string; updatedAt?: string }): string {
  if (!item.updatedAt) return item.url;
  const v = Date.parse(item.updatedAt);
  return Number.isNaN(v) ? item.url : `${item.url}?v=${v}`;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaManager({
  initialItems,
}: {
  initialItems: MediaItem[];
}) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const [metaForm, setMetaForm] = useState({
    title: "",
    altText: "",
    description: "",
    tagsText: "",
  });
  const [resizeForm, setResizeForm] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    if (!res.ok) throw new Error("Không thể tải danh sách media");
    const data = (await res.json()) as MediaItem[];
    setItems(data);
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files);
      if (list.length === 0) return;

      const invalid = list.find(
        (f) => f.size > MAX_SIZE || !ALLOWED_TYPES.includes(f.type)
      );
      if (invalid) {
        setError(
          `File "${invalid.name}" không hợp lệ (tối đa 5MB, định dạng JPG/PNG/WebP/GIF)`
        );
        return;
      }

      setUploading(true);
      try {
        for (const file of list) {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Upload thất bại");
          }
        }
        await refreshMedia();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload thất bại");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [refreshMedia]
  );

  const openEdit = (item: MediaItem) => {
    setSelected(item);
    setMetaForm({
      title: item.title || "",
      altText: item.altText || "",
      description: item.description || "",
      tagsText: (item.tags || []).join(", "),
    });
    setResizeForm({ width: item.width || 0, height: item.height || 0 });
    setCopied(false);
    setError(null);
  };

  const closeEdit = () => {
    if (saving || resizing || deleting) return;
    setSelected(null);
  };

  const saveMetadata = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const tags = metaForm.tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const res = await fetch(`/api/media/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: metaForm.title,
          altText: metaForm.altText,
          description: metaForm.description,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu metadata");
      setSelected(data as MediaItem);
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleResize = async () => {
    if (!selected) return;
    setResizing(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${selected.id}/resize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resizeForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể thay đổi kích thước");
      setSelected(data as MediaItem);
      setResizeForm({ width: data.width, height: data.height });
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setResizing(false);
    }
  };

  const handleRestore = async () => {
    if (!selected) return;
    setRestoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${selected.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể khôi phục kích thước");
      setSelected(data as MediaItem);
      setResizeForm({ width: data.width, height: data.height });
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirm(`Bạn có chắc muốn xóa ảnh "${selected.title || selected.originalName}"?`))
      return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${selected.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa ảnh");
      }
      setItems((prev) => prev.filter((m) => m.id !== selected.id));
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setDeleting(false);
    }
  };

  const copyUrl = async (item: MediaItem) => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Không thể sao chép URL");
    }
  };

  const seoDone = (m: MediaItem) => Boolean(m.title || m.altText);

  return (
    <div className="space-y-6">
      {error && (
        <div className="px-4 py-3 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
          }}
        />
        <div className="text-3xl mb-2">📤</div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {uploading ? "Đang tải lên..." : "Kéo thả ảnh vào đây hoặc bấm để chọn"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          JPG, PNG, WebP, GIF — tối đa 5MB mỗi ảnh
        </p>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có hình ảnh nào trong thư viện. Hãy tải lên ảnh đầu tiên.
          </p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-250px)] lg:max-h-[calc(100vh-290px)] min-h-[220px] overflow-y-auto pr-2 -mr-2 pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openEdit(item)}
              className="group text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                <Image
                  src={mediaSrc(item)}
                  alt={item.altText || item.title || item.originalName}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform"
                  unoptimized={item.mimeType === "image/gif"}
                />
                {seoDone(item) && (
                  <span
                    title="Đã có metadata SEO"
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/60 rounded-full backdrop-blur"
                  >
                    ● SEO
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.title || item.originalName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {item.width && item.height
                    ? `${item.width} × ${item.height}`
                    : ""}{" "}
                  {formatBytes(item.size)}
                </p>
              </div>
            </button>
          ))}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Chỉnh sửa hình ảnh
              </h2>
              <button
                onClick={closeEdit}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video flex items-center justify-center">
                <Image
                  src={mediaSrc(selected)}
                  alt={selected.altText || selected.originalName}
                  width={selected.width || 800}
                  height={selected.height || 450}
                  className="max-h-[300px] w-auto object-contain"
                  unoptimized={selected.mimeType === "image/gif"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {selected.filename}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {selected.mimeType}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {selected.width} × {selected.height}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {formatBytes(selected.size)}
                </span>
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {new Date(selected.createdAt).toLocaleDateString("vi-VN")}
                </span>
                <button
                  onClick={() => copyUrl(selected)}
                  className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                  {copied ? "Đã sao chép ✓" : "Sao chép URL"}
                </button>
              </div>

              {/* SEO metadata */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Thông tin SEO
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Tiêu đề, mô tả và alt text giúp hình ảnh được tối ưu trên Google Images.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tiêu đề (Title)
                    </label>
                    <input
                      type="text"
                      value={metaForm.title}
                      onChange={(e) =>
                        setMetaForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="VD: Hướng dẫn Next.js cho người mới"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Alt text (quan trọng cho SEO)
                    </label>
                    <input
                      type="text"
                      value={metaForm.altText}
                      onChange={(e) =>
                        setMetaForm((f) => ({ ...f, altText: e.target.value }))
                      }
                      placeholder="Mô tả ngắn nội dung hình ảnh"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Mô tả (Description)
                    </label>
                    <textarea
                      value={metaForm.description}
                      onChange={(e) =>
                        setMetaForm((f) => ({
                          ...f,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Mô tả chi tiết hơn về hình ảnh"
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tags (phân tách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={metaForm.tagsText}
                      onChange={(e) =>
                        setMetaForm((f) => ({
                          ...f,
                          tagsText: e.target.value,
                        }))
                      }
                      placeholder="nextjs, react, hướng dẫn"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={saveMetadata}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {saving ? "Đang lưu..." : "Lưu thông tin"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resize */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Thay đổi kích thước
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Ảnh sẽ được crop giữ nguyên tỷ lệ để ra đúng kích thước
                  chiều rộng × chiều cao bạn nhập (không bị méo).
                </p>
                <div className="flex items-end gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Chiều rộng (px)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={resizeForm.width || ""}
                      onChange={(e) =>
                        setResizeForm((f) => ({
                          ...f,
                          width: Number(e.target.value),
                        }))
                      }
                      className={`${inputClass} w-32`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Chiều cao (px)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={resizeForm.height || ""}
                      onChange={(e) =>
                        setResizeForm((f) => ({
                          ...f,
                          height: Number(e.target.value),
                        }))
                      }
                      className={`${inputClass} w-32`}
                    />
                  </div>
                  <button
                    onClick={handleResize}
                    disabled={resizing}
                    className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                  >
                    {resizing ? "Đang xử lý..." : "Resize ảnh"}
                  </button>
                </div>
                {selected.originalWidth > 0 &&
                  (selected.width !== selected.originalWidth ||
                    selected.height !== selected.originalHeight) && (
                    <button
                      onClick={handleRestore}
                      disabled={restoring}
                      className="mt-3 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition-colors"
                    >
                      {restoring
                        ? "Đang khôi phục..."
                        : `Khôi phục kích thước gốc (${selected.originalWidth}×${selected.originalHeight})`}
                    </button>
                  )}
              </div>

              {/* Danger zone */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Xóa hình ảnh khỏi thư viện và thư mục uploads.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Đang xóa..." : "Xóa ảnh"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}