"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  user?: { name?: string | null; email?: string | null } | null;
  collapsed: boolean;
  onClose: () => void;
}

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/posts", label: "Bài viết", icon: "📝" },
  { href: "/admin/posts/new", label: "Viết mới", icon: "✏️" },
  { href: "/admin/categories", label: "Danh mục", icon: "🗂️" },
  { href: "/admin/media", label: "Hình ảnh", icon: "🖼️" },
  { href: "/", label: "Xem site", icon: "🌐" },
];

export default function AdminSidebar({ user, collapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-full h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 overflow-y-auto overflow-x-hidden">
      {/* Header */}
      <div className={`border-b border-gray-200 dark:border-gray-800 flex items-center ${collapsed ? "flex-col py-4 px-2" : "justify-between py-4 px-6"}`}>
        <Link
          href="/admin"
          onClick={onClose}
          title={collapsed ? "Admin Panel" : undefined}
          className={`flex items-center gap-2 ${collapsed ? "justify-center" : ""}`}
        >
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 shrink-0">{"</>"}</span>
          {!collapsed && (
            <span className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">Admin Panel</span>
          )}
        </Link>
        {/* Close button — mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 ${collapsed ? "p-2" : "p-4"}`}>
        {adminLinks.map((link) => {
          const isActive =
            link.href === "/"
              ? false
              : link.href === "/admin/posts/new"
                ? pathname === "/admin/posts/new"
                : link.href === "/admin/posts"
                  ? pathname === "/admin/posts" || (pathname.startsWith("/admin/posts/") && !pathname.startsWith("/admin/posts/new"))
                  : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              title={collapsed ? link.label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } text-sm font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span className="shrink-0">{link.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + sign out */}
      <div className={`border-t border-gray-200 dark:border-gray-800 ${collapsed ? "p-2" : "p-4"}`}>
        {user && (
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center mb-3" : "mb-3"}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {user.name?.charAt(0) || "A"}
              </span>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          title={collapsed ? "Đăng xuất" : undefined}
          className={`w-full text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors ${
            collapsed ? "flex items-center justify-center px-2 py-2.5" : "px-3 py-2.5 text-left"
          }`}
        >
          {collapsed ? "🚪" : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}
