"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Nút tài khoản trên header client.
 * - Chưa đăng nhập: nút "Đăng nhập" dẫn tới /login (kèm callbackUrl).
 * - Đã đăng nhập: avatar + tên; bấm mở menu với nút đăng xuất.
 */
export default function UserMenu() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (pathname.startsWith("/admin") || pathname === "/login") {
    return null;
  }

  if (status === "loading") {
    return (
      <div
        className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
        aria-hidden
      />
    );
  }

  if (status === "unauthenticated") {
    const callbackUrl = encodeURIComponent(pathname);
    return (
      <Link
        href={`/login?callbackUrl=${callbackUrl}`}
        className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        Đăng nhập
      </Link>
    );
  }

  const name = (session?.user?.name || session?.user?.email || "Thành viên").trim();
  const initial = (name.charAt(0) || "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tài khoản"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
          {initial}
        </span>
        <span className="hidden md:block max-w-[10rem] truncate text-sm font-medium text-gray-700 dark:text-gray-300">
          {session?.user?.name || session?.user?.email}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {session?.user?.name || "Thành viên"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email}
            </p>
          </div>
          <Link
            href="/courses"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Khóa học
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}