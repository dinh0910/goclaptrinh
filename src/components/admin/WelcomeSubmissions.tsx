"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { WelcomeField } from "@/lib/welcome-config";

interface Submission {
  id: number;
  itemId: string;
  popupName: string;
  fields: WelcomeField[];
  data: Record<string, string>;
  createdAt: string;
}

export default function WelcomeSubmissions() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/welcome/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách đăng ký");
        return res.json() as Promise<{ submissions: Submission[] }>;
      })
      .then((data) => setSubs(data.submissions))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    try {
      const res = await fetch("/api/welcome/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        toast.error(data?.error || "Không thể xóa đăng ký");
        return;
      }
      setSubs((prev) => prev.filter((s) => s.id !== id));
      setConfirmId(null);
      toast.success("Đã xóa đăng ký");
    } catch {
      toast.error("Đã có lỗi xảy ra");
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Đang tải danh sách đăng ký...
      </p>
    );
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Đăng ký nhận tin
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Các đăng ký do khách truy cập gửi từ popup có form. Tổng{" "}
          <b>{subs.length}</b> đăng ký.
        </p>
      </div>

      {subs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-8 text-center">
          Chưa có đăng ký nào.
        </p>
      ) : (
        <div className="space-y-3">
          {subs.map((s) => {
            const labelOf = new Map(s.fields.map((f) => [f.id, f.label]));
            const entries = Object.entries(s.data);
            return (
              <div
                key={s.id}
                className="rounded-xl border-2 border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                      #{s.id}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {s.popupName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(s.createdAt)}
                    </span>
                    {confirmId === s.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Xóa đăng ký này?
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(s.id)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                        >
                          Chắc chắn
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="text-xs font-medium px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(s.id)}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
                {entries.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    (Không có dữ liệu)
                  </p>
                ) : (
                  <dl className="flex flex-wrap gap-x-6 gap-y-1">
                    {entries.map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          {labelOf.get(key) || key}
                        </dt>
                        <dd className="text-sm font-medium text-gray-800 dark:text-gray-200 break-all">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}