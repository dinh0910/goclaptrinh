"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { WelcomeItem } from "@/lib/welcome-config";

const STORAGE_KEY = "welcome-seen-at";

export default function WelcomeDialog() {
  const pathname = usePathname();
  const [config, setConfig] = useState<WelcomeItem | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    let cancelled = false;
    fetch("/api/welcome")
      .then((res) =>
        res.ok ? (res.json() as Promise<{ item?: WelcomeItem | null }>) : null
      )
      .then((data) => {
        if (cancelled || !data?.item) return;
        const cfg = data.item;
        if (!cfg.active || !cfg.title) return;
        let seen = 0;
        try {
          seen = Number(localStorage.getItem(STORAGE_KEY) || 0);
        } catch {
          seen = 0;
        }
        const due =
          cfg.reappearHours > 0 &&
          Date.now() - seen >= cfg.reappearHours * 3600_000;
        if (seen === 0 || due) setConfig(cfg);
      })
      .catch(() => {
        // Bỏ qua lỗi — không hiển thị popup
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (config) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [config]);

  if (!config) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setConfig(null);
  };

  const isExternal =
    config.buttonLink.startsWith("http://") ||
    config.buttonLink.startsWith("https://");
  const cta = config.buttonText ? (
    config.buttonLink.startsWith("/") || isExternal ? (
      isExternal ? (
        <a
          href={config.buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
        >
          {config.buttonText}
        </a>
      ) : (
        <Link
          href={config.buttonLink}
          onClick={dismiss}
          className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
        >
          {config.buttonText}
        </Link>
      )
    ) : null
  ) : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng"
          className="absolute top-3 right-3 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 pt-10 pb-8 text-center">
          {config.emoji && (
            <div className="text-5xl mb-3 leading-none">{config.emoji}</div>
          )}
          {config.badge && (
            <span className="inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20 rounded-full mb-4">
              {config.badge}
            </span>
          )}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {config.title}
          </h2>
          {config.content && (
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-line">
              {config.content}
            </p>
          )}
          {cta && <div className="mt-6">{cta}</div>}
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-xs font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}