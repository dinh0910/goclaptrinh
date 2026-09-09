"use client";

import { useState } from "react";
import { useTheme } from "@/components/shared/ThemeProvider";
import {
  FONT_SCALES,
  useAdminSettings,
  type FontScale,
} from "@/components/admin/AdminSettings";

function OptionCard({
  label,
  description,
  active,
  onClick,
  children,
}: {
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex-1 min-w-[140px] max-w-[220px] rounded-xl border-2 p-4 text-left transition-all ${
        active
          ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      }`}
    >
      {active && (
        <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {children}
      <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </button>
  );
}

export default function AdminSettingsPage() {
  const { theme, setTheme } = useTheme();
  const { settings, setCollapsed, setFontScale, reset } = useAdminSettings();
  const [saved, setSaved] = useState(false);

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tùy chỉnh giao diện admin cho bạn — tự động lưu ngay khi thay đổi.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            reset();
            markSaved();
          }}
          className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Khôi phục mặc định
        </button>
      </div>

      {saved && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-sm text-green-700 dark:text-green-400">
          Đã lưu cài đặt của bạn.
        </div>
      )}

      {/* Giao diện */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Giao diện
        </h2>
        <div className="flex flex-wrap gap-4">
          <OptionCard
            label="Sáng"
            description="Giao diện nền sáng"
            active={theme === "light"}
            onClick={() => {
              setTheme("light");
              markSaved();
            }}
          >
            <div className="flex flex-col gap-1 rounded-lg border border-gray-200 bg-white p-2">
              <div className="h-2 w-3/4 rounded bg-gray-200" />
              <div className="h-1.5 w-full rounded bg-gray-100" />
              <div className="h-1.5 w-2/3 rounded bg-gray-100" />
            </div>
          </OptionCard>
          <OptionCard
            label="Tối"
            description="Giao diện nền tối"
            active={theme === "dark"}
            onClick={() => {
              setTheme("dark");
              markSaved();
            }}
          >
            <div className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-900 p-2">
              <div className="h-2 w-3/4 rounded bg-gray-600" />
              <div className="h-1.5 w-full rounded bg-gray-800" />
              <div className="h-1.5 w-2/3 rounded bg-gray-800" />
            </div>
          </OptionCard>
        </div>
      </section>

      {/* Layout */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Layout
        </h2>
        <div className="flex flex-wrap gap-4">
          <OptionCard
            label="Thanh bên mở rộng"
            description="Hiển thị đầy đủ nhãn menu"
            active={!settings.collapsed}
            onClick={() => {
              setCollapsed(false);
              markSaved();
            }}
          >
            <div className="flex gap-1.5">
              <div className="w-8 shrink-0 space-y-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
                <div className="h-1 w-full rounded bg-gray-300 dark:bg-gray-600" />
                <div className="h-1 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-1 w-full rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex-1 space-y-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
                <div className="h-1.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-1.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          </OptionCard>
          <OptionCard
            label="Thanh bên thu gọn"
            description="Chỉ hiển thị icon, rộng hơn cho nội dung"
            active={settings.collapsed}
            onClick={() => {
              setCollapsed(true);
              markSaved();
            }}
          >
            <div className="flex gap-1.5">
              <div className="w-5 shrink-0 space-y-1 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-1">
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="flex-1 space-y-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1">
                <div className="h-1.5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-1.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          </OptionCard>
        </div>
      </section>

      {/* Cỡ chữ */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Cỡ chữ
        </h2>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(FONT_SCALES) as FontScale[]).map((key) => {
            const opt = FONT_SCALES[key];
            return (
              <OptionCard
                key={key}
                label={opt.label}
                description={`${opt.px}px`}
                active={settings.fontScale === key}
                onClick={() => {
                  setFontScale(key);
                  markSaved();
                }}
              >
                <p className={`text-gray-700 dark:text-gray-300 ${opt.preview}`}>
                  Aa
                </p>
              </OptionCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}