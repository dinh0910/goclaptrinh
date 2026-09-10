"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import FloatingPanel from "./FloatingPanel";

interface AdminSidebarProps {
  user?: { name?: string | null; email?: string | null } | null;
  permissions?: string[];
  collapsed: boolean;
  onClose: () => void;
}

interface AdminLink {
  href: string;
  label: string;
  icon: string;
  permission?: string;
}

const adminLinks: AdminLink[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/posts", label: "Bài viết", icon: "📝", permission: "posts" },
  { href: "/admin/posts/new", label: "Viết mới", icon: "✏️", permission: "posts" },
  { href: "/admin/categories", label: "Danh mục", icon: "🗂️", permission: "categories" },
  { href: "/admin/media", label: "Hình ảnh", icon: "🖼️", permission: "media" },
  { href: "/admin/banners", label: "Banner", icon: "🎨", permission: "banners" },
  { href: "/admin/users", label: "Người dùng", icon: "👥", permission: "users" },
  { href: "/admin/roles", label: "Vai trò", icon: "🛡️", permission: "users" },
  { href: "/admin/settings", label: "Cài đặt", icon: "⚙️" },
  { href: "/", label: "Xem site", icon: "🌐" },
];

export default function AdminSidebar({ user, permissions, collapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLButtonElement>(null);
  const perms = permissions ?? [];
  const visibleLinks = adminLinks.filter(
    (link) => !link.permission || perms.includes(link.permission)
  );

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
        {visibleLinks.map((link) => {
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

      {/* User info + menu */}
      <div className={`border-t border-gray-200 dark:border-gray-800 ${collapsed ? "p-2" : "p-4"}`}>
        {user && (
          <div className={collapsed ? "mb-3 flex justify-center" : "mb-2"}>
            <button
              ref={userMenuRef}
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              title={collapsed ? "Menu tài khoản" : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                collapsed ? "justify-center w-9 h-9" : "w-full px-1.5 py-1.5"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-white">
                  {user.name?.charAt(0) || "A"}
                </span>
              </div>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                  <svg
                    className={`shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </>
              )}
            </button>

            <FloatingPanel
              open={userMenuOpen}
              anchorRef={userMenuRef}
              onClose={() => setUserMenuOpen(false)}
              className="py-1 min-w-52"
            >
              <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  router.push("/admin/settings");
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="w-4 flex justify-center">⚙️</span>
                Cài đặt
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <span className="w-4 flex justify-center">🚪</span>
                Đăng xuất
              </button>
            </FloatingPanel>
          </div>
        )}
      </div>
    </aside>
  );
}
