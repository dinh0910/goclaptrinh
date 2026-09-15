export interface RoleMeta {
  label: string;
  bg: string;
  text: string;
  darkBg: string;
  darkText: string;
  swatch: string;
}

export const ROLE_META: Record<string, RoleMeta> = {
  admin: {
    label: "Quản trị viên",
    bg: "bg-red-50", text: "text-red-700",
    darkBg: "dark:bg-red-500/10", darkText: "dark:text-red-400",
    swatch: "bg-red-500",
  },
  editor: {
    label: "Biên tập viên",
    bg: "bg-blue-50", text: "text-blue-700",
    darkBg: "dark:bg-blue-500/10", darkText: "dark:text-blue-400",
    swatch: "bg-blue-500",
  },
  author: {
    label: "Tác giả",
    bg: "bg-amber-50", text: "text-amber-700",
    darkBg: "dark:bg-amber-500/10", darkText: "dark:text-amber-400",
    swatch: "bg-amber-500",
  },
  viewer: {
    label: "Xem",
    bg: "bg-gray-100", text: "text-gray-700",
    darkBg: "dark:bg-gray-500/10", darkText: "dark:text-gray-400",
    swatch: "bg-gray-500",
  },
};

export function roleMeta(role?: string | null): RoleMeta {
  return ROLE_META[role || "viewer"] || ROLE_META.viewer;
}

export const DEFAULT_USER_ROLE = "viewer";

export const PERMISSION_OPTIONS: { key: string; label: string }[] = [
  { key: "all", label: "Toàn quyền" },
  { key: "posts", label: "Bài viết" },
  { key: "categories", label: "Danh mục" },
  { key: "media", label: "Hình ảnh" },
  { key: "banners", label: "Banner" },
  { key: "welcome", label: "Popup giới thiệu" },
  { key: "newsletter", label: "Newsletter" },
  { key: "analytics", label: "Thống kê" },
  { key: "comments", label: "Bình luận" },
  { key: "users", label: "Người dùng & vai trò" },
];