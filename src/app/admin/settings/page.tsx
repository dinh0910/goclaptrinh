"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FONT_SCALES,
  useAdminSettings,
  type FontScale,
} from "@/components/admin/AdminSettings";
import type { AdminTheme } from "@/lib/admin-prefs";

interface Draft {
  theme: AdminTheme;
  fontScale: FontScale;
}

const DEFAULTS: Draft = {
  theme: "light",
  fontScale: "md",
};

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
  const { settings, setFontScale } = useAdminSettings();
  const [adminTheme, setAdminTheme] = useState<AdminTheme>("light");
  const [draft, setDraft] = useState<Draft | null>(null);

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

  const current = draft ?? {
    theme: adminTheme,
    fontScale: settings.fontScale,
  };

  const save = async () => {
    if (!draft) return;
    setFontScale(draft.fontScale);
    try {
      const res = await fetch("/api/admin/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: draft.theme }),
      });
      if (!res.ok) throw new Error("Không thể lưu theme");
      setAdminTheme(draft.theme);
      window.dispatchEvent(
        new CustomEvent("admin:theme", { detail: draft.theme })
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      return;
    }
    setDraft(null);
    toast.success("Đã lưu cài đặt của bạn");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tùy chỉnh giao diện admin cho tài khoản của bạn — thay đổi có
            hiệu lực khi bấm <b>Lưu cài đặt</b>. Theme chỉ áp dụng riêng cho
            tài khoản này, không ảnh hưởng tới trang chủ (client).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft({ ...DEFAULTS })}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!draft}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>

      {/* Giao diện */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
          Giao diện
        </h2>
        <div className="flex flex-wrap gap-4">
          <OptionCard
            label="Sáng"
            description="Giao diện nền sáng"
            active={current.theme === "light"}
            onClick={() => setDraft({ ...current, theme: "light" })}
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
            active={current.theme === "dark"}
            onClick={() => setDraft({ ...current, theme: "dark" })}
          >
            <div className="flex flex-col gap-1 rounded-lg border border-gray-700 bg-gray-900 p-2">
              <div className="h-2 w-3/4 rounded bg-gray-600" />
              <div className="h-1.5 w-full rounded bg-gray-800" />
              <div className="h-1.5 w-2/3 rounded bg-gray-800" />
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
                active={current.fontScale === key}
                onClick={() => setDraft({ ...current, fontScale: key })}
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