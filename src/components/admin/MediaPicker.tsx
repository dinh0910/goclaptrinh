"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MediaItem } from "./MediaManager";

interface MediaPickerProps {
  onSelect: (item: MediaItem) => void;
  onClose: () => void;
}

// Cache-busting URL: the file at a URL can change (e.g. after resize) while the
// path stays the same, so version it from `updatedAt` to force a fresh fetch.
function mediaSrc(item: { url: string; updatedAt?: string }): string {
  if (!item.updatedAt) return item.url;
  const v = Date.parse(item.updatedAt);
  return Number.isNaN(v) ? item.url : `${item.url}?v=${v}`;
}

export default function MediaPicker({ onSelect, onClose }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải thư viện media");
        return res.json() as Promise<MediaItem[]>;
      })
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : "Đã có lỗi xảy ra"))
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter((m) =>
        [m.title, m.altText, m.description, m.originalName, m.filename]
          .concat(m.tags || [])
          .some((s) => s.toLowerCase().includes(q))
      )
    : items;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        className="w-full max-w-3xl max-h-[80vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Chọn ảnh từ thư viện
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 pt-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, alt text, tag..."
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          )}
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Đang tải...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Không tìm thấy hình ảnh nào.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group text-left bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
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
                  </div>
                  <p className="px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 truncate">
                    {item.title || item.originalName}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}