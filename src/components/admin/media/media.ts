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

export const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const VIDEO_MAX_SIZE = 512 * 1024 * 1024;
export const MAX_RESIZE_BYTES = 1 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_EXTS = [".mp4", ".m4v", ".webm", ".ogv", ".ogg", ".mov"];

// Cache-busting URL: the file at a given URL can change (e.g. after resize)
// while the path stays the same, so append a version from `updatedAt` to force
// next/image's optimizer and the browser to refetch the updated file.
export function mediaSrc(item: { url: string; updatedAt?: string }): string {
  if (!item.updatedAt) return item.url;
  const v = Date.parse(item.updatedAt);
  return Number.isNaN(v) ? item.url : `${item.url}?v=${v}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isVideoItem(m: { mimeType: string }): boolean {
  return m.mimeType.startsWith("video/");
}

export function isVideoFile(f: { type: string; name: string }): boolean {
  return VIDEO_EXTS.some((e) => f.name.toLowerCase().endsWith(e));
}