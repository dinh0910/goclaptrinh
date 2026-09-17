"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useTableControls } from "@/components/admin/ui/useTableControls";
import type { MediaItem } from "./media";
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_MAX_SIZE,
  MAX_RESIZE_BYTES,
  VIDEO_MAX_SIZE,
  isVideoFile,
} from "./media";
import UploadZone from "./UploadZone";
import MediaGrid from "./MediaGrid";
import MediaEditModal from "./MediaEditModal";

export default function MediaManager({
  initialItems,
}: {
  initialItems: MediaItem[];
}) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaItem | null>(null);

  const [metaForm, setMetaForm] = useState({
    title: "",
    altText: "",
    description: "",
    tagsText: "",
  });
  const [resizeForm, setResizeForm] = useState({ width: 0, height: 0 });
  const [resizeMode, setResizeMode] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    w: number;
    h: number;
    dir: "both" | "h" | "v";
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const ctrl = useTableControls<MediaItem>({
    pageSize: 15,
    searchKeys: [
      (m) => m.title || "",
      (m) => m.originalName || "",
      (m) => m.altText || "",
      (m) => m.tags.join(" "),
      (m) => m.mimeType,
    ],
  });
  const { total, totalPages, page, pageItems } = ctrl.process(items, (key, m) => {
    switch (key) {
      case "name":
        return m.title || m.originalName;
      case "size":
        return m.size;
      case "createdAt":
        return m.createdAt;
      default:
        return "";
    }
  });

  const refreshMedia = useCallback(async () => {
    const res = await fetch("/api/media");
    if (!res.ok) throw new Error("Không thể tải danh sách media");
    const data = (await res.json()) as MediaItem[];
    setItems(data);
  }, []);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;

      const invalid = list.find((f) => {
        const video = isVideoFile(f);
        if (video) {
          return f.size > VIDEO_MAX_SIZE;
        }
        return f.size > IMAGE_MAX_SIZE || !ALLOWED_IMAGE_TYPES.includes(f.type);
      });
      if (invalid) {
        toast.error(
          `File "${invalid.name}" không hợp lệ (ảnh tối đa 5MB: JPG/PNG/WebP/GIF; video tối đa 512MB: MP4/WebM/OGG)`
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
        toast.success(`Đã tải lên ${list.length} mục media`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload thất bại");
      } finally {
        setUploading(false);
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
  };

  const closeEdit = () => {
    if (saving || resizing || deleting) return;
    setSelected(null);
  };

  const saveMetadata = async () => {
    if (!selected) return;

    const title = metaForm.title.trim();
    const altText = metaForm.altText.trim();
    const description = metaForm.description.trim();

    if (!altText) {
      toast.error("Vui lòng nhập Alt text — yếu tố quan trọng nhất cho SEO hình ảnh.");
      return;
    }

    setSaving(true);
    try {
      const tags = metaForm.tagsText
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const res = await fetch(`/api/media/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          altText,
          description,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu metadata");
      setSelected(data as MediaItem);
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      toast.success("Đã lưu metadata");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const handleResize = async () => {
    if (!selected) return;
    const w = Number(resizeForm.width) || 0;
    const h = Number(resizeForm.height) || 0;
    if (w <= 0 || h <= 0) {
      toast.error("Vui lòng nhập kích thước hợp lệ");
      return;
    }
    // Rough size estimate proportional to pixel count.
    if (selected.size > 0) {
      const estimated =
        (selected.size * w * h) / (selected.width * selected.height || 1);
      if (estimated > MAX_RESIZE_BYTES) {
        toast.error("Kích thước ảnh sau khi resize ước tính trên 1MB. Vui lòng giảm kích thước xuống.");
        return;
      }
    }
    setResizing(true);
    try {
      const res = await fetch(`/api/media/${selected.id}/resize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width: w, height: h }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể thay đổi kích thước");
      setSelected(data as MediaItem);
      setResizeForm({ width: data.width, height: data.height });
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      toast.success("Đã thay đổi kích thước");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setResizing(false);
    }
  };

  const handleRestore = async () => {
    if (!selected) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/media/${selected.id}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể khôi phục kích thước");
      setSelected(data as MediaItem);
      setResizeForm({ width: data.width, height: data.height });
      setItems((prev) => prev.map((m) => (m.id === data.id ? data : m)));
      setShowRestoreDialog(false);
      toast.success("Đã khôi phục kích thước gốc");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      setShowRestoreDialog(false);
    } finally {
      setRestoring(false);
    }
  };

  const openRestoreDialog = () => {
    if (!selected) return;
    setShowRestoreDialog(true);
  };

  const startResizeDrag = (e: React.PointerEvent) => {
    if (!selected) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    el.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      w: resizeForm.width || selected.width,
      h: resizeForm.height || selected.height,
      dir: ((e.currentTarget as HTMLElement).dataset.dir as "both" | "h" | "v") || "both",
    };
  };

  const onResizeDrag = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start || !selected) return;
    // Map css px deltas back to real image px.
    const scale = Math.min(1, 480 / selected.width, 300 / selected.height);
    const dw = (e.clientX - start.x) / scale;
    const dh = (e.clientY - start.y) / scale;

    if (start.dir === "h") {
      setResizeForm({ width: Math.max(1, Math.round(start.w + dw)), height: start.h });
      return;
    }
    if (start.dir === "v") {
      setResizeForm({ width: start.w, height: Math.max(1, Math.round(start.h + dh)) });
      return;
    }

    // Corner drag: free resize with Shift, otherwise locked ratio.
    const freeW = Math.max(1, Math.round(start.w + dw));
    const freeH = Math.max(1, Math.round(start.h + dh));
    if (e.shiftKey) {
      setResizeForm({ width: freeW, height: freeH });
      return;
    }
    const factor = Math.max(freeW / start.w, freeH / start.h);
    setResizeForm({
      width: Math.max(1, Math.round(start.w * factor)),
      height: Math.max(1, Math.round(start.h * factor)),
    });
  };

  const endResizeDrag = (e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    dragStartRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const toggleResizeMode = () => {
    if (!selected) return;
    if (resizeMode) {
      // Turning the toggle off applies the resized dimensions.
      setResizeMode(false);
      void handleResize();
    } else {
      // Turning it on resets the form to the current dimensions.
      setResizeMode(true);
      setResizeForm({ width: selected.width || 0, height: selected.height || 0 });
    }
  };

  const openDeleteDialog = () => {
    if (!selected) return;
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/media/${selected.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Không thể xóa ảnh");
      }
      setItems((prev) => prev.filter((m) => m.id !== selected.id));
      setSelected(null);
      setShowDeleteDialog(false);
      toast.success("Đã xóa hình ảnh");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      setShowDeleteDialog(false);
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
      toast.error("Không thể sao chép URL");
    }
  };

  return (
    <div className="space-y-6">
      <UploadZone uploading={uploading} onFiles={uploadFiles} />

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chưa có media nào trong thư viện. Hãy tải lên ảnh hoặc video đầu tiên.
          </p>
        </div>
      ) : (
        <MediaGrid
          items={pageItems}
          search={ctrl.search}
          onSearch={ctrl.setSearchAndReset}
          sortKey={ctrl.sortKey}
          sortDir={ctrl.sortDir}
          onSort={ctrl.setColumnSort}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={ctrl.pageSize}
          onPageChange={ctrl.setPage}
          onPageSizeChange={ctrl.setPageSize}
          onOpen={openEdit}
        />
      )}

      {selected && (
        <MediaEditModal
          selected={selected}
          metaForm={metaForm}
          setMetaForm={setMetaForm}
          resizeForm={resizeForm}
          setResizeForm={setResizeForm}
          resizeMode={resizeMode}
          toggleResizeMode={toggleResizeMode}
          saving={saving}
          saveMetadata={saveMetadata}
          resizing={resizing}
          handleResize={handleResize}
          restoring={restoring}
          handleRestore={handleRestore}
          showRestoreDialog={showRestoreDialog}
          openRestoreDialog={openRestoreDialog}
          closeRestoreDialog={() => setShowRestoreDialog(false)}
          deleting={deleting}
          handleDelete={handleDelete}
          showDeleteDialog={showDeleteDialog}
          openDeleteDialog={openDeleteDialog}
          closeDeleteDialog={() => setShowDeleteDialog(false)}
          closeEdit={closeEdit}
          copied={copied}
          copyUrl={copyUrl}
          startResizeDrag={startResizeDrag}
          onResizeDrag={onResizeDrag}
          endResizeDrag={endResizeDrag}
        />
      )}
    </div>
  );
}