"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { HeroPreset } from "@/lib/hero-config";

const TEMPLATES: { key: string; label: string }[] = [
  { key: "hero-text", label: "Nội dung + Code" },
  { key: "hero-center", label: "Canh giữa" },
  { key: "hero-glow", label: "Nền tối phát sáng" },
];

export default function BannerList() {
  const [presets, setPresets] = useState<HeroPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{
    action: "activate" | "delete";
    id: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/hero")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách banner");
        return res.json() as Promise<{ presets: HeroPreset[] }>;
      })
      .then((data) => setPresets(data.presets))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const persist = async (
    next: HeroPreset[],
    previous: HeroPreset[]
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presets: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Không thể lưu banner");
      }
      setPresets(next);
      return true;
    } catch (e) {
      setPresets(previous);
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
      return false;
    }
  };

  const activate = async (id: string) => {
    const previous = presets;
    const target = previous.find((p) => p.id === id);
    if (!target || target.active) return;
    const next = previous.map((p) => ({ ...p, active: p.id === id }));
    if (await persist(next, previous)) {
      setConfirm(null);
      toast.success(`Đã kích hoạt biến thể “${target.name}”`);
    }
  };

  const remove = async (id: string) => {
    if (presets.length <= 1) return;
    const previous = presets;
    const removing = previous.find((p) => p.id === id);
    if (!removing || removing.active) return;
    const next = previous.filter((p) => p.id !== id);
    if (next.length === 0) return;
    if (!(await persist(next, previous))) return;
    setConfirm(null);
    toast.success(`Đã xóa biến thể “${removing.name}”`);
    if (next.every((p) => !p.active)) {
      await persist(
        next.map((p, i) => (i === 0 ? { ...p, active: true } : p)),
        next
      );
    }
  };

  const add = () => {
    router.push("/admin/banners/new");
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đang tải danh sách banner...
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý banner
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Danh sách biến thể banner cho trang chủ. Bấm{" "}
            <b>Chỉnh sửa</b> để vào trang sửa từng biến thể. Chỉ 1 biến thể{" "}
            <b>đang dùng</b> được hiển thị.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Biến thể ({presets.length})
        </h2>
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm biến thể
        </button>
      </div>

      <div className="space-y-2">
        {presets.map((p, i) => (
          <div
            key={p.id}
            className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900 transition-all"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="shrink-0 text-xs font-semibold text-gray-400 dark:text-gray-500">
                #{i + 1}
              </span>
              <span className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {p.name}
              </span>
            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {TEMPLATES.find((t) => t.key === p.config.template)?.label ||
                p.config.template}
            </span>

            {confirm?.id === p.id ? (
              confirm.action === "delete" ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Xóa biến thể này?
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Chắc chắn
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm(null)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Kích hoạt biến thể này làm banner trang chủ?
                  </span>
                  <button
                    type="button"
                    onClick={() => activate(p.id)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Kích hoạt
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirm(null)}
                    className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                {p.active ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-blue-600 text-white">
                    Đang dùng
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirm({ action: "activate", id: p.id })}
                    className="text-xs font-medium px-2.5 py-1 rounded-md text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                  >
                    Kích hoạt
                  </button>
                )}
                <Link
                  href={`/admin/banners/${p.id}`}
                  className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Chỉnh sửa
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirm({ action: "delete", id: p.id })}
                  disabled={presets.length <= 1 || p.active}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title={
                    p.active
                      ? "Biến thể đang dùng không thể xóa"
                      : "Xóa biến thể"
                  }
                >
                  Xóa
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}