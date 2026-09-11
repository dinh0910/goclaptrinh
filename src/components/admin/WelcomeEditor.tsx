"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  WELCOME_EMOJIS,
  emptyWelcomeItem,
  type WelcomeItem,
} from "@/lib/welcome-config";

const inputClass =
  "w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white";

export default function WelcomeEditor({
  id,
  mode,
}: {
  id: string;
  mode: "new" | "edit";
}) {
  const router = useRouter();
  const [form, setForm] = useState<WelcomeItem>(() => emptyWelcomeItem());
  const [exists, setExists] = useState(mode === "new");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit") return;
    let cancelled = false;
    fetch("/api/welcome/admin")
      .then((res) =>
        res.ok ? (res.json() as Promise<{ items: WelcomeItem[] }>) : null
      )
      .then((data) => {
        if (cancelled) return;
        const found = data?.items.find((i) => i.id === id);
        if (found) {
          setForm(found);
          setExists(true);
        } else {
          setExists(false);
        }
      })
      .catch(() => toast.error("Không thể tải popup giới thiệu"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const set = <K extends keyof WelcomeItem>(key: K, value: WelcomeItem[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên popup");
      return;
    }
    if (form.active && !form.title.trim()) {
      toast.error("Popup đang bật cần có tiêu đề");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/welcome/admin").catch(() => null);
      const current = res && res.ok
        ? ((await res.json()) as { items?: WelcomeItem[] }).items ?? []
        : [];
      const exists = current.some((i) => i.id === form.id);
      const items = exists
        ? current.map((i) => (i.id === form.id ? form : i))
        : [...current, form];
      if (items.length === 0) {
        toast.error("Không thể lưu popup");
        return;
      }
      const put = await fetch("/api/welcome/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await put.json();
      if (!put.ok) {
        toast.error(data.error || "Không thể lưu popup");
        return;
      }
      toast.success(exists ? "Đã cập nhật popup giới thiệu" : "Đã tạo popup giới thiệu");
      router.push("/admin/welcome");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (mode === "edit" && !exists) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Đang tải popup giới thiệu...
          </p>
        ) : (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Không tìm thấy popup giới thiệu này.
            </p>
            <Link
              href="/admin/welcome"
              className="text-sm font-medium text-blue-600 dark:text-blue-400 underline"
            >
              Quay lại danh sách
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="xl:grid xl:grid-cols-[1fr_380px] xl:gap-6 xl:items-start">
      {/* Form */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6 xl:mb-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {mode === "edit" ? "Chỉnh sửa popup" : "Popup mới"}
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                aria-label="Bật bật popup này"
                onClick={() => set("active", !form.active)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.active ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    form.active ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {form.active ? "Hiển thị" : "Ẩn"}
              </span>
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Tên popup (hiển thị trong danh sách)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="VD: Khuyến mãi Tết"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nhãn nhỏ (badge)
            </label>
            <input
              type="text"
              value={form.badge}
              onChange={(e) => set("badge", e.target.value)}
              placeholder="VD: ƯU ĐÃI, TIN MỚI"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Tiêu đề
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Tiêu đề hiển thị trong popup"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Nội dung
            </label>
            <textarea
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={4}
              placeholder="Nội dung giới thiệu khuyến mãi / thông báo..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Biểu tượng (emoji)
            </label>
            <div className="grid grid-cols-6 gap-2 mb-2">
              {WELCOME_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set("emoji", em)}
                  className={`h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                    form.emoji === em
                      ? "bg-blue-100 dark:bg-blue-500/20 ring-1 ring-blue-500"
                      : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.emoji}
              onChange={(e) => set("emoji", e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Nút chính (text)
              </label>
              <input
                type="text"
                value={form.buttonText}
                onChange={(e) => set("buttonText", e.target.value)}
                placeholder="VD: Khám phá ngay"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Link của nút
              </label>
              <input
                type="text"
                value={form.buttonLink}
                onChange={(e) => set("buttonLink", e.target.value)}
                placeholder="/blog hoặc https://..."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Hiện lại sau khi đóng (giờ)
            </label>
            <input
              type="number"
              min={0}
              max={8760}
              value={form.reappearHours}
              onChange={(e) =>
                set("reappearHours", Math.max(0, Number(e.target.value) || 0))
              }
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Nhập 0 để chỉ hiện đúng một lần mỗi trình duyệt. Mặc định 24 giờ.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-5">
          <Link
            href="/admin/welcome"
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ← Quay lại danh sách
          </Link>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu popup"}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 xl:sticky xl:top-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Xem trước
        </h2>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden shadow-lg">
          <div className="relative px-6 pt-8 pb-6 text-center">
            <div className="text-5xl mb-3">{form.emoji || "🎉"}</div>
            {form.badge && (
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20 rounded-full mb-3">
                {form.badge}
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {form.title || "Tiêu đề"}
            </h3>
            {form.content && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 whitespace-pre-line">
                {form.content}
              </p>
            )}
            {form.buttonText && (
              <div className="mt-5">
                <span className="inline-block px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg">
                  {form.buttonText}
                </span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
          {form.active
            ? "Popup này sẽ được hiển thị cho khách truy cập trang chủ."
            : "Popup này hiện đang bị ẩn."}
        </p>
      </div>
    </div>
  );
}