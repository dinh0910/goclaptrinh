"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { WelcomeVisual } from "@/components/client/welcome/WelcomeVisual";
import type { WelcomeItem } from "@/lib/welcome-config";

const STORAGE_KEY = "welcome-seen-at";

export default function WelcomeDialog() {
  const pathname = usePathname();
  const [config, setConfig] = useState<WelcomeItem | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
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
        if (!(seen === 0 || due)) return;
        const delayMs = Math.min(60, Math.max(0, cfg.appearDelay || 0)) * 1000;
        timer = setTimeout(() => {
          if (!cancelled) setConfig(cfg);
        }, delayMs);
      })
      .catch(() => {
        // Bỏ qua lỗi — không hiển thị popup
      });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Đóng"
          className="absolute -top-3 -right-3 z-10 p-2 rounded-full text-gray-500 bg-white dark:text-gray-300 dark:bg-gray-800 shadow-lg ring-1 ring-black/10 dark:ring-white/10 hover:scale-105 transition-transform"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <WelcomeVisual item={config} onAction={dismiss} />

        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={dismiss}
            className="text-xs font-medium text-white/70 hover:text-white transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}