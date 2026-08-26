"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  user?: { name?: string | null; email?: string | null } | null;
  children: React.ReactNode;
}

export default function AdminShell({ user, children }: AdminShellProps) {
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

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
          ${collapsed ? "lg:w-16" : "lg:w-64"}
          w-64
        `}
      >
        <AdminSidebar
          user={user}
          collapsed={collapsed}
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
            onClick={() => setCollapsed((c) => !c)}
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
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
