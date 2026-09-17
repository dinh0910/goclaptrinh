"use client";

import Image from "next/image";
import type { Dispatch, PointerEvent, SetStateAction } from "react";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { TextArea } from "@/components/shared/TextArea";
import FieldNumber from "@/components/admin/ui/FieldNumber";
import type { MediaItem } from "./media";
import { formatBytes, isVideoItem, mediaSrc } from "./media";

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

function seoFieldClass(over: boolean): string {
  return over
    ? `${inputClass} border-red-400 dark:border-red-500 focus:ring-red-500`
    : inputClass;
}

// SEO-standard limits (Google Search / Google Images best practices).
const SEO_LIMITS = { title: 60, altText: 125, description: 160, tags: 200 };

function counterClass(count: number, max: number): string {
  if (count > max) return "text-red-600 dark:text-red-400 font-semibold";
  if (count >= max * 0.9) return "text-amber-500 dark:text-amber-400 font-medium";
  return "text-gray-400 dark:text-gray-500";
}

function SeoCounter({
  count,
  limit,
  note,
}: {
  count: number;
  limit: number;
  note: string;
}) {
  const over = count > limit;
  return (
    <div className="mt-1 space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-gray-400 dark:text-gray-500">{note}</span>
        <span className={counterClass(count, limit)}>
          {count}/{limit} ký tự
        </span>
      </div>
      {over && (
        <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">
          Đã vượt quá {limit} ký tự — Google sẽ cắt bớt phần hiển thị, nên rút gọn
          để tối ưu SEO.
        </p>
      )}
    </div>
  );
}

interface MetaForm {
  title: string;
  altText: string;
  description: string;
  tagsText: string;
}

interface ResizeForm {
  width: number;
  height: number;
}

interface MediaEditModalProps {
  selected: MediaItem;
  metaForm: MetaForm;
  setMetaForm: Dispatch<SetStateAction<MetaForm>>;
  resizeForm: ResizeForm;
  setResizeForm: Dispatch<SetStateAction<ResizeForm>>;
  resizeMode: boolean;
  toggleResizeMode: () => void;
  saving: boolean;
  saveMetadata: () => void;
  resizing: boolean;
  handleResize: () => void;
  restoring: boolean;
  handleRestore: () => void;
  showRestoreDialog: boolean;
  openRestoreDialog: () => void;
  closeRestoreDialog: () => void;
  deleting: boolean;
  handleDelete: () => void;
  showDeleteDialog: boolean;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  closeEdit: () => void;
  copied: boolean;
  copyUrl: (item: MediaItem) => void;
  startResizeDrag: (e: PointerEvent) => void;
  onResizeDrag: (e: PointerEvent) => void;
  endResizeDrag: (e: PointerEvent) => void;
}

export default function MediaEditModal(props: MediaEditModalProps) {
  const {
    selected,
    metaForm,
    setMetaForm,
    resizeForm,
    setResizeForm,
    resizeMode,
    toggleResizeMode,
    saving,
    saveMetadata,
    resizing,
    handleResize,
    restoring,
    handleRestore,
    showRestoreDialog,
    openRestoreDialog,
    closeRestoreDialog,
    deleting,
    handleDelete,
    showDeleteDialog,
    openDeleteDialog,
    closeDeleteDialog,
    closeEdit,
    copied,
    copyUrl,
    startResizeDrag,
    onResizeDrag,
    endResizeDrag,
  } = props;

  const isVideo = isVideoItem(selected);

  const scale = Math.min(1, 480 / selected.width, 300 / selected.height);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Chỉnh sửa {isVideo ? "video" : "hình ảnh"}
          </h2>
          <button
            onClick={closeEdit}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preview */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video flex items-center justify-center">
            {isVideo ? (
              <video
                src={mediaSrc(selected)}
                controls
                className="max-h-[300px] w-auto"
              />
            ) : resizeMode ? (
              <div
                className="relative select-none"
                style={{
                  width: Math.max(20, resizeForm.width * scale),
                  height: Math.max(20, resizeForm.height * scale),
                }}
              >
                <Image
                  src={mediaSrc(selected)}
                  alt={selected.altText || selected.originalName}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-fill"
                  unoptimized={selected.mimeType === "image/gif"}
                />
                <div className="absolute inset-0 border-2 border-blue-500 border-dashed pointer-events-none" />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-semibold text-white bg-blue-600 rounded pointer-events-none">
                  {Math.max(1, resizeForm.width)} × {Math.max(1, resizeForm.height)}
                </span>
                <div
                  data-dir="h"
                  onPointerDown={startResizeDrag}
                  onPointerMove={onResizeDrag}
                  onPointerUp={endResizeDrag}
                  onPointerCancel={endResizeDrag}
                  className="absolute bottom-0 right-0 w-1.5 h-full cursor-ew-resize touch-none"
                  style={{
                    background:
                      "linear-gradient(-90deg, rgba(59,130,246,.7), rgba(59,130,246,0))",
                  }}
                />
                <div
                  data-dir="v"
                  onPointerDown={startResizeDrag}
                  onPointerMove={onResizeDrag}
                  onPointerUp={endResizeDrag}
                  onPointerCancel={endResizeDrag}
                  className="absolute bottom-0 right-0 w-full h-1.5 cursor-ns-resize touch-none"
                  style={{
                    background:
                      "linear-gradient(0deg, rgba(59,130,246,.7), rgba(59,130,246,0))",
                  }}
                />
                <div
                  data-dir="both"
                  onPointerDown={startResizeDrag}
                  onPointerMove={onResizeDrag}
                  onPointerUp={endResizeDrag}
                  onPointerCancel={endResizeDrag}
                  className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize touch-none"
                  style={{
                    background:
                      "conic-gradient(from 90deg, transparent 0 25%, #3b82f6 25% 50%, transparent 50% 75%, #3b82f6 75% 100%)",
                    borderTopLeftRadius: "6px",
                  }}
                />
              </div>
            ) : (
              <Image
                src={mediaSrc(selected)}
                alt={selected.altText || selected.originalName}
                width={selected.width || 800}
                height={selected.height || 450}
                className="max-h-[300px] w-auto object-contain"
                unoptimized={selected.mimeType === "image/gif"}
              />
            )}

            {!isVideo && (
              <button
                type="button"
                onClick={toggleResizeMode}
                title={
                  resizeMode
                    ? "Tắt và lưu kích thước lên hệ thống"
                    : "Bật chế độ kéo thả thay đổi kích thước"
                }
                className={`absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full backdrop-blur transition-all ${
                  resizeMode
                    ? "bg-blue-600 text-white opacity-100 shadow-lg"
                    : "bg-black/50 text-white opacity-60 hover:opacity-100"
                }`}
              >
                {resizeMode ? "✦ Đang kéo thả — tắt để lưu" : "✥ Kéo thả"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {selected.filename}
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {selected.mimeType}
            </span>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {selected.width && selected.height
                ? `${selected.width} × ${selected.height}`
                : "—"}
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

          {!isVideo && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Thay đổi kích thước
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Ảnh sẽ được đổi thành đúng kích thước chiều rộng × chiều cao
                bạn nhập.
              </p>
              {resizeMode && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                  Kéo các cạnh trong preview: cạnh phải (ngang), cạnh dưới
                  (dọc) hoặc góc (cả 2, khóa tỷ lệ — giữ Shift để phóng tự do).
                  Tắt nút để lưu.
                </p>
              )}
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Chiều rộng (px)
                  </label>
                  <FieldNumber
                    value={resizeForm.width || 0}
                    onChange={(v) => setResizeForm((f) => ({ ...f, width: v }))}
                    min={1}
                    className="w-32"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Chiều cao (px)
                  </label>
                  <FieldNumber
                    value={resizeForm.height || 0}
                    onChange={(v) => setResizeForm((f) => ({ ...f, height: v }))}
                    min={1}
                    className="w-32"
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
                    onClick={openRestoreDialog}
                    disabled={restoring}
                    className="mt-3 px-4 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50 transition-colors"
                  >
                    {restoring
                      ? "Đang khôi phục..."
                      : `Khôi phục kích thước gốc (${selected.originalWidth}×${selected.originalHeight})`}
                  </button>
                )}
            </div>
          )}

          {/* SEO metadata */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
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
                  className={seoFieldClass(metaForm.title.length > SEO_LIMITS.title)}
                />
                <SeoCounter
                  count={metaForm.title.length}
                  limit={SEO_LIMITS.title}
                  note="Nên trong 50-60 ký tự"
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
                  className={seoFieldClass(metaForm.altText.length > SEO_LIMITS.altText)}
                />
                <SeoCounter
                  count={metaForm.altText.length}
                  limit={SEO_LIMITS.altText}
                  note="Nên trong 100-125 ký tự"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mô tả (Description)
                </label>
                <TextArea
                  value={metaForm.description}
                  onChange={(e) =>
                    setMetaForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả chi tiết hơn về hình ảnh"
                  rows={3}
                  className={
                    metaForm.description.length > SEO_LIMITS.description
                      ? "border-red-400 dark:border-red-500 focus:ring-red-500"
                      : undefined
                  }
                />
                <SeoCounter
                  count={metaForm.description.length}
                  limit={SEO_LIMITS.description}
                  note="Nên trong 120-158 ký tự"
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
                  className={seoFieldClass(metaForm.tagsText.length > SEO_LIMITS.tags)}
                />
                <SeoCounter
                  count={metaForm.tagsText.length}
                  limit={SEO_LIMITS.tags}
                  note="3-5 tag là hợp lý"
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

          {/* Danger zone */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Xóa {isVideo ? "video" : "hình ảnh"} khỏi thư viện và storage.
            </p>
            <button
              onClick={openDeleteDialog}
              disabled={deleting}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              Xóa {isVideo ? "video" : "ảnh"}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        title={`Xóa ${isVideo ? "video" : "hình ảnh"}`}
        message={`Bạn có chắc muốn xóa "${
          selected.title || selected.originalName
        }" không? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={closeDeleteDialog}
      />

      {/* Restore confirmation dialog */}
      <ConfirmDialog
        open={showRestoreDialog}
        title="Khôi phục kích thước gốc"
        message={`Bạn có chắc muốn khôi phục "${
          selected.title || selected.originalName
        }" về kích thước gốc ${selected.originalWidth}×${
          selected.originalHeight
        } không?`}
        confirmLabel="Khôi phục"
        cancelLabel="Hủy"
        loading={restoring}
        onConfirm={handleRestore}
        onCancel={closeRestoreDialog}
      />
    </div>
  );
}