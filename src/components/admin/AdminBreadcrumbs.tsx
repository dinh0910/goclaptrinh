"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTION_LABELS: Record<string, string> = {
  posts: "Bài viết",
  categories: "Danh mục",
  media: "Media",
  users: "Người dùng",
  roles: "Vai trò",
  settings: "Cài đặt",
  banners: "Banner",
};

function leafLabel(section: string, rest: string[]): string {
  switch (section) {
    case "posts":
      if (rest[0] === "new") return "Viết bài mới";
      if (rest.length === 2 && rest[1] === "edit")
        return "Chỉnh sửa bài viết";
      return rest[0] || "Chi tiết";
    case "banners":
      if (rest[0] === "new") return "Thêm biến thể mới";
      return "Chỉnh sửa biến thể";
    default:
      return rest[0] || "Chi tiết";
  }
}

function defaultLabel(segment: string): string {
  return segment.length > 24 ? `${segment.slice(0, 24)}…` : segment;
}

export default function AdminBreadcrumbs() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "admin") return null;

  const crumbs: { label: string; href: string }[] = [
    { label: "Dashboard", href: "/admin" },
  ];

  const section = segments[1];
  const rest = segments.slice(2);

  if (section && SECTION_LABELS[section]) {
    crumbs.push({ label: SECTION_LABELS[section], href: `/admin/${section}` });
    if (rest.length > 0) {
      crumbs.push({ label: leafLabel(section, rest), href: pathname });
    }
  } else if (section) {
    // Khu vực chưa có nhãn — hiện tên thô (user thêm route mới)
    crumbs.push({ label: defaultLabel(section), href: `/admin/${section}` });
    if (rest.length > 0) {
      crumbs.push({ label: defaultLabel(rest[rest.length - 1]), href: pathname });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={`${i}-${crumb.label}`} className="flex items-center gap-1.5">
              {i > 0 && (
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="font-semibold text-gray-900 dark:text-white">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}