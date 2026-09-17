"use client";

import Image from "next/image";
import { SearchBar } from "@/components/admin/ui/SearchBar";
import { Pagination } from "@/components/admin/ui/Pagination";
import type { MediaItem } from "./media";
import { formatBytes, isVideoItem, mediaSrc } from "./media";

interface MediaGridProps {
  items: MediaItem[];
  search: string;
  onSearch: (v: string) => void;
  sortKey: string | null;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  onOpen: (item: MediaItem) => void;
}

export default function MediaGrid({
  items,
  search,
  onSearch,
  sortKey,
  sortDir,
  onSort,
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onOpen,
}: MediaGridProps) {
  const seoDone = (m: MediaItem) => Boolean(m.title || m.altText);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800">
        <SearchBar
          value={search}
          onChange={onSearch}
          placeholder="Tìm theo tên, alt, tag, định dạng..."
        />
        <div className="flex items-center gap-2 text-sm">
          {[
            { key: "name", label: "Tên" },
            { key: "size", label: "Kích thước" },
            { key: "createdAt", label: "Ngày" },
          ].map(({ key, label }) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSort(key)}
                className={`px-2 py-1 text-sm rounded-lg transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {label} {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </button>
            );
          })}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Không tìm thấy hình ảnh nào phù hợp.
        </p>
      ) : (
        <>
          <div className="max-h-[calc(100vh-250px)] lg:max-h-[calc(100vh-290px)] min-h-[220px] overflow-y-auto pr-2 -mr-2 pb-2 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item)}
                  className="group text-left bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
                    {isVideoItem(item) ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                        <svg
                          className="w-10 h-10 text-white/80"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[10px] font-semibold text-white bg-black/50 rounded-md">
                          {(item.mimeType.split("/")[1] || "").toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <Image
                        src={mediaSrc(item)}
                        alt={item.altText || item.title || item.originalName}
                        fill
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform"
                        unoptimized={item.mimeType === "image/gif"}
                      />
                    )}
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
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </div>
  );
}