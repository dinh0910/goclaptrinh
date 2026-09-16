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
  permission?: string;
}

interface AdminTopLink {
  kind: "link";
  href: string;
  label: string;
  icon: string;
  permission?: string;
}

interface AdminSection {
  kind: "section";
  key: string;
  label: string;
  icon: string;
  permission?: string;
  children: AdminLink[];
}

type NavItem = AdminTopLink | AdminSection;

const navItems: NavItem[] = [
  { kind: "link", href: "/admin", label: "Dashboard", icon: "📊" },
  { kind: "link", href: "/admin/analytics", label: "Thống kê", icon: "📈", permission: "analytics" },
  {
    kind: "section",
    key: "posts",
    label: "Bài viết",
    icon: "📝",
    permission: "posts",
    children: [
      { href: "/admin/posts", label: "Danh sách" },
      { href: "/admin/posts/new", label: "Thêm mới" },
    ],
  },
  { kind: "link", href: "/admin/categories", label: "Danh mục", icon: "🗂️", permission: "categories" },
  {
    kind: "section",
    key: "courses",
    label: "Khóa học",
    icon: "🎓",
    permission: "courses",
    children: [
      { href: "/admin/courses", label: "Danh sách" },
      { href: "/admin/courses/new", label: "Thêm mới" },
      { href: "/admin/courses/levels", label: "Cấp độ" },
    ],
  },
  { kind: "link", href: "/admin/comments", label: "Bình luận", icon: "💬", permission: "comments" },
  { kind: "link", href: "/admin/media", label: "Hình ảnh", icon: "🖼️", permission: "media" },
  {
    kind: "section",
    key: "banners",
    label: "Banner",
    icon: "🎨",
    permission: "banners",
    children: [
      { href: "/admin/banners", label: "Danh sách" },
      { href: "/admin/banners/new", label: "Thêm mới" },
    ],
  },
  { kind: "link", href: "/admin/users", label: "Người dùng", icon: "👥", permission: "users" },
  { kind: "link", href: "/admin/roles", label: "Vai trò", icon: "🛡️", permission: "users" },
  {
    kind: "section",
    key: "welcome",
    label: "Popup chào mừng",
    icon: "🎉",
    permission: "welcome",
    children: [
      { href: "/admin/welcome", label: "Danh sách" },
      { href: "/admin/welcome/new", label: "Thêm mới" },
      { href: "/admin/welcome/submissions", label: "Đăng ký nhận tin" },
    ],
  },
  { kind: "link", href: "/admin/newsletter", label: "Newsletter", icon: "📧", permission: "newsletter" },
  { kind: "link", href: "/admin/security", label: "Bảo mật", icon: "🔐" },
  { kind: "link", href: "/admin/audit", label: "Nhật ký", icon: "📋" },
  { kind: "link", href: "/admin/backups", label: "Sao lưu", icon: "💾" },
  { kind: "link", href: "/admin/settings", label: "Cài đặt", icon: "⚙️" },
  { kind: "link", href: "/", label: "Xem site", icon: "🌐" },
];

const sectionChildActive = (child: AdminLink, pathname: string): boolean => {
  if (
    child.href === "/admin/posts" ||
    child.href === "/admin/banners" ||
    child.href === "/admin/courses"
  ) {
    const isExact = pathname === child.href;
    const isChild = pathname.startsWith(child.href + "/");
    const isNew = pathname.startsWith(child.href + "/new");
    const isLevels = child.href === "/admin/courses" && pathname.startsWith("/admin/courses/levels");
    return isExact || (isChild && !isNew && !isLevels);
  }
  if (child.href === "/admin/welcome") {
    return (
      pathname === child.href ||
      (pathname.startsWith(child.href + "/") &&
        !pathname.startsWith(child.href + "/new") &&
        !pathname.startsWith(child.href + "/submissions"))
    );
  }
  return pathname === child.href;
};

const sectionActive = (section: AdminSection, pathname: string): boolean =>
  section.children.some((c) => sectionChildActive(c, pathname));

function SidebarSection({
  section,
  collapsed,
  open,
  active,
  pathname,
  onToggle,
  onClose,
}: {
  section: AdminSection;
  collapsed: boolean;
  open: boolean;
  active: boolean;
  pathname: string;
  onToggle: () => void;
  onClose: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);

  const handleClick = () => {
    if (collapsed) setFlyoutOpen((o) => !o);
    else onToggle();
  };

  return (
    <div>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        title={collapsed ? section.label : undefined}
        className={`w-full flex items-center gap-3 rounded-lg transition-colors ${
          collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
        } text-sm font-medium ${
          active
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        }`}
      >
        <span className="shrink-0">{section.icon}</span>
        {!collapsed && (
          <>
            <span className="whitespace-nowrap flex-1 text-left">{section.label}</span>
            <svg
              className={`shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
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

      {!collapsed && open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-gray-200 dark:border-gray-700 space-y-0.5">
          {section.children.map((child) => {
            const childIsActive = sectionChildActive(child, pathname);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  childIsActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current opacity-40" />
                <span className="whitespace-nowrap">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {collapsed && (
        <FloatingPanel
          open={flyoutOpen}
          anchorRef={btnRef}
          onClose={() => setFlyoutOpen(false)}
          className="py-1 min-w-40"
        >
          <p className="px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {section.label}
          </p>
          {section.children.map((child) => {
            const childIsActive = sectionChildActive(child, pathname);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => {
                  setFlyoutOpen(false);
                  onClose();
                }}
                className={`flex items-center gap-2.5 px-3.5 py-2 text-sm text-left transition-colors ${
                  childIsActive
                    ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </FloatingPanel>
      )}
    </div>
  );
}

export default function AdminSidebar({ user, permissions, collapsed, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLButtonElement>(null);
  const perms = permissions ?? [];
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || perms.includes(item.permission)
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of visibleNavItems) {
      if (item.kind === "section" && sectionActive(item, pathname)) init[item.key] = true;
    }
    return init;
  });

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
      <nav className={`flex-1 space-y-0.5 ${collapsed ? "p-2" : "p-4"}`}>
        {visibleNavItems.map((item, index) =>
          item.kind === "section" ? (
            <SidebarSection
              key={item.key}
              section={item}
              collapsed={collapsed}
              open={!!openSections[item.key]}
              active={sectionActive(item, pathname)}
              pathname={pathname}
              onToggle={() =>
                setOpenSections((s) => ({ ...s, [item.key]: !s[item.key] }))
              }
              onClose={onClose}
            />
          ) : (
            <Link
              key={item.href ?? index}
              href={item.href}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } text-sm font-medium ${
                item.href === "/"
                  ? "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  : pathname === item.href
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        )}
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
