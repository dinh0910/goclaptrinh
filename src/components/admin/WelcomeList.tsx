"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { WELCOME_TEMPLATES, type WelcomeItem } from "@/lib/welcome-config";

const templateLabel = (key: WelcomeItem["template"]) =>
  WELCOME_TEMPLATES.find((t) => t.key === key)?.label || key;

export default function WelcomeList() {
  const [items, setItems] = useState<WelcomeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<{
    action: "activate" | "delete";
    id: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/welcome/admin")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách popup");
        return res.json() as Promise<{ items: WelcomeItem[] }>;
      })
      .then((data) => setItems(data.items))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const persist = async (
    next: WelcomeItem[]
  ): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/welcome/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) return { ok: false, error: data?.error };
      setItems(next);
      return { ok: true };
    } catch {
      return { ok: false, error: "Đã có lỗi xảy ra" };
    }
  };

  const activate = async (id: string) => {
    const previous = items;
    const target = previous.find((p) => p.id === id);
    if (!target || target.active) return;
    const next = previous.map((p) => ({ ...p, active: p.id === id }));
    const res = await persist(next);
    if (res.ok) {
      setConfirm(null);
      toast.success(`Đã kích hoạt popup “${target.name}”`);
    } else {
      setItems(previous);
      toast.error(res.error || "Không thể kích hoạt popup");
    }
  };

  const remove = async (id: string) => {
    if (items.length <= 1) return;
    const previous = items;
    const removing = previous.find((p) => p.id === id);
    if (!removing) return;
    const next = previous.filter((p) => p.id !== id);
    if (next.length === 0) return;
    const res = await persist(next);
    if (!res.ok) {
      setItems(previous);
      toast.error(res.error || "Không thể xóa popup");
      return;
    }
    setConfirm(null);
    toast.success(`Đã xóa popup “${removing.name}”`);
    if (next.every((p) => !p.active)) {
      const re = await persist(
        next.map((x, i) => (i === 0 ? { ...x, active: true } : x))
      );
      if (!re.ok) {
        setItems(next);
        toast.error(re.error || "Không thể kích hoạt popup thay thế");
      }
    }
  };

  const add = () => {
    router.push("/admin/welcome/new");
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đang tải danh sách popup...
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Popup giới thiệu
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý các popup giới thiệu hiển thị cho khách truy cập trang chủ.
            Chỉ{" "}
            <b>một popup đang hiển thị</b> được bật tại một thời điểm.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Popup ({items.length})
        </h2>
        <button
          type="button"
          onClick={add}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Thêm popup
        </button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-6 text-center">
            Chưa có popup nào. Bấm “+ Thêm popup” để tạo popup đầu tiên.
          </p>
        ) : (
          items.map((p, i) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900"
            >
              <span className="shrink-0 text-xs font-semibold text-gray-400 dark:text-gray-500">
                #{i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {p.emoji} {p.name}
              </span>
              {p.badge && (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {p.badge}
                </span>
              )}
              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {templateLabel(p.template)}
              </span>
              <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                {p.reappearHours === 0
                  ? "Chỉ hiện 1 lần"
                  : `Hiện lại sau ${p.reappearHours}h`}
                {" · "}Sau {p.appearDelay}s
              </span>

              {confirm?.id === p.id ? (
                confirm.action === "delete" ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Xóa popup này?
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
                      Hiển thị popup này?
                    </span>
                    <button
                      type="button"
                      onClick={() => activate(p.id)}
                      className="text-xs font-semibold px-2.5 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Bật hiển thị
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
                      Đang hiển thị
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirm({ action: "activate", id: p.id })}
                      className="text-xs font-medium px-2.5 py-1 rounded-md text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                    >
                      Hiển thị
                    </button>
                  )}
                  <Link
                    href={`/admin/welcome/${p.id}`}
                    className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Chỉnh sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirm({ action: "delete", id: p.id })}
                    disabled={items.length <= 1}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title={
                      items.length <= 1
                        ? "Cần giữ ít nhất một popup"
                        : "Xóa popup"
                    }
                  >
                    Xóa
                  </button>
                </div>
              )}
            </div>
          ))
        )}

        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="text-base">👋</span>
            <span>
              Trang chủ sẽ hiển thị popup <b>đang bật</b> cho khách truy cập khi
              họ vào lần đầu hoặc sau khi đóng đủ số giờ đã cài đặt.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}