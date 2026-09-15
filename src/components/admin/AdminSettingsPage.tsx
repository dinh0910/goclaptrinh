"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FONT_SCALES,
  useAdminSettings,
  type FontScale,
} from "@/components/admin/AdminSettings";
import type { AdminTheme } from "@/lib/admin-prefs";
import AiSettings from "./AiSettings";

type Tab = "appearance" | "font" | "ai";

const TABS: { key: Tab; label: string }[] = [
  { key: "appearance", label: "Giao diện" },
  { key: "font", label: "Cỡ chữ" },
  { key: "ai", label: "AI" },
];

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

export default function AdminSettingsPage({
  canManageAi,
}: {
  canManageAi: boolean;
}) {
  const { settings, setFontScale } = useAdminSettings();
  const [tab, setTab] = useState<Tab>("appearance");
  const [adminTheme, setAdminTheme] = useState<AdminTheme>("light");
  const [draftTheme, setDraftTheme] = useState<AdminTheme | null>(null);
  const [draftFont, setDraftFont] = useState<FontScale | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/theme")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<{ theme?: AdminTheme }>)
          : Promise.reject(new Error("Không thể tải theme"))
      )
      .then((data) => {
        if (data.theme === "light" || data.theme === "dark") {
          setAdminTheme(data.theme);
        }
      })
      .catch(() => {
        // Giữ theme mặc định
      });
  }, []);

  const currentTheme = draftTheme ?? adminTheme;
  const currentFont = draftFont ?? settings.fontScale;

  const saveTheme = async () => {
    if (!draftTheme) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: draftTheme }),
      });
      if (!res.ok) throw new Error("Không thể lưu theme");
      setAdminTheme(draftTheme);
      window.dispatchEvent(
        new CustomEvent("admin:theme", { detail: draftTheme })
      );
      setDraftTheme(null);
      toast.success("Đã lưu giao diện");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  const saveFont = async () => {
    if (!draftFont) return;
    setSaving(true);
    try {
      setFontScale(draftFont);
      setDraftFont(null);
      toast.success("Đã lưu cỡ chữ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý giao diện admin, AI hỗ trợ viết và các tùy chỉnh của hệ
            thống.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {TABS.filter((t) => t.key !== "ai" || canManageAi).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "appearance" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Giao diện admin
              </h2>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Chọn chế độ sáng/tối cho trang quản trị.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDraftTheme("light")}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={saveTheme}
                disabled={!draftTheme || saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <OptionCard
              label="Sáng"
              description="Giao diện nền sáng"
              active={currentTheme === "light"}
              onClick={() => setDraftTheme("light")}
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
              active={currentTheme === "dark"}
              onClick={() => setDraftTheme("dark")}
            >
              <div className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-900 p-2">
                <div className="h-2 w-3/4 rounded bg-gray-600" />
                <div className="h-1.5 w-full rounded bg-gray-800" />
                <div className="h-1.5 w-2/3 rounded bg-gray-800" />
              </div>
            </OptionCard>
          </div>
        </>
      )}

      {tab === "font" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Cỡ chữ
              </h2>
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Chọn cỡ chữ hiển thị cho bài viết.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDraftFont("md")}
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                Khôi phục mặc định
              </button>
              <button
                type="button"
                onClick={saveFont}
                disabled={!draftFont || saving}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(FONT_SCALES) as FontScale[]).map((key) => {
              const opt = FONT_SCALES[key];
              return (
                <OptionCard
                  key={key}
                  label={opt.label}
                  description={`${opt.px}px`}
                  active={currentFont === key}
                  onClick={() => setDraftFont(key)}
                >
                  <p className={`text-gray-700 dark:text-gray-300 ${opt.preview}`}>
                    Aa
                  </p>
                </OptionCard>
              );
            })}
          </div>
        </>
      )}

      {tab === "ai" && canManageAi && (
        <>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              AI hỗ trợ viết
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
              Quản lý nhà cung cấp API và cấu hình hành động AI cho trình soạn thảo.
            </p>
          </div>
          <AiSettings />
        </>
      )}
    </div>
  );
}