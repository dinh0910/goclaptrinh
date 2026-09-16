"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { siteConfig } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/blog", label: "Blog" },
  { href: "/courses", label: "Khóa học" },
  { href: "/categories", label: "Danh mục" },
  { href: "/about", label: "Giới thiệu" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const handleEscape = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") handleEscape();
      });
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 dark:bg-gray-950/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {"</>"}
            </span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {siteConfig.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <form
              action="/search"
              method="get"
              className="hidden lg:block relative"
              role="search"
            >
              <input
                type="search"
                name="q"
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm bài viết"
                className="w-40 xl:w-52 py-2 pl-9 pr-3 text-sm bg-gray-100 border border-transparent rounded-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 text-gray-900 placeholder:text-gray-400 transition-all dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
              />
              <svg
                className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </form>
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label={isOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={isOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isOpen && (
          <nav className="md:hidden pb-4" aria-label="Mobile navigation">
            <form
              action="/search"
              method="get"
              className="relative mb-2"
              role="search"
            >
              <input
                type="search"
                name="q"
                placeholder="Tìm kiếm bài viết..."
                aria-label="Tìm kiếm bài viết"
                className="w-full py-2 pl-9 pr-3 text-sm bg-gray-100 border border-transparent rounded-lg outline-none focus:bg-white focus:border-blue-500 text-gray-900 placeholder:text-gray-400 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-900"
              />
              <svg
                className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:text-blue-400 dark:hover:bg-gray-800"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
