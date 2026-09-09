"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import { AdminSettingsProvider, useAdminSettings } from "./AdminSettings";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

const MIN_NAV_MS = 350;

interface AdminShellProps {
  user?: { name?: string | null; email?: string | null } | null;
  permissions?: string[];
  children: React.ReactNode;
}

export default function AdminShell({ user, permissions, children }: AdminShellProps) {
  return (
    <AdminSettingsProvider>
      <Shell user={user} permissions={permissions}>
        {children}
      </Shell>
    </AdminSettingsProvider>
  );
}

function Shell({ user, permissions, children }: AdminShellProps) {
  const { settings, setCollapsed } = useAdminSettings();
  const [open, setOpen] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const navStartRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Finished navigating when pathname changed; keep the loading state visible
  // for a moment so fast transitions don't just flash.
  useEffect(() => {
    if (pathRef.current === pathname) return;
    pathRef.current = pathname;
    const elapsed = Date.now() - navStartRef.current;
    const delay = Math.max(0, MIN_NAV_MS - elapsed);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setNavigating(false), delay);
  }, [pathname]);

  useEffect(() => {
    const startNav = () => {
      navStartRef.current = Date.now();
      setNavigating(true);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      const href = anchor.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("#"))
        return;
      const [linkPath] = href.split(/[?#]/);
      if (linkPath === location.pathname) return;
      startNav();
    };
    const onNavEvent = () => startNav();
    document.addEventListener("click", onClick, true);
    document.addEventListener("admin:navigation", onNavEvent);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("admin:navigation", onNavEvent);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <div className="flex h-full w-full">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40
          transition-all duration-300 ease-in-out
          lg:static lg:transition-[width]
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${settings.collapsed ? "lg:w-16" : "lg:w-64"}
          w-64
        `}
      >
        <AdminSidebar
          user={user}
          permissions={permissions}
          collapsed={settings.collapsed}
          onClose={() => setOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!settings.collapsed)}
            className="hidden lg:block p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Admin Panel</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-8">
            {navigating ? (
              <LoadingScreen label="Đang tải trang..." />
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}