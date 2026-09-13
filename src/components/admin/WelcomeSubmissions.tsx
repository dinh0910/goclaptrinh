"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { WelcomeField } from "@/lib/welcome-config";

interface Submission {
  id: number;
  itemId: string;
  popupName: string;
  fields: WelcomeField[];
  data: Record<string, string>;
  createdAt: string;
  visitorKey: string;
  device: string;
  ip: string;
  visitNumber: number;
  visitsTotal: number;
  repeat: boolean;
}

interface Stats {
  total: number;
  uniqueVisitors: number;
}

export default function WelcomeSubmissions() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, uniqueVisitors: 0 });
  const [loading, setLoading] = useState(true);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [onlyRepeat, setOnlyRepeat] = useState(false);

  useEffect(() => {
    fetch("/api/welcome/submissions")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách đăng ký");
        return res.json() as Promise<{
          submissions: Submission[];
          stats: Stats;
        }>;
      })
      .then((data) => {
        setSubs(data.submissions);
        setStats(data.stats);
      })
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subs.filter((s) => {
      if (onlyRepeat && !s.repeat) return false;
      if (!q) return true;
      const haystack = [
        String(s.id),
        s.popupName,
        s.visitorKey,
        s.device,
        s.ip,
        ...Object.values(s.data),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [subs, query, onlyRepeat]);

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
      setStats((st) => ({
        ...st,
        total: Math.max(0, st.total - 1),
      }));
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
          <b>{stats.total}</b> đăng ký từ <b>{stats.uniqueVisitors}</b> client
          khác nhau.
        </p>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lọc theo client, IP, thiết bị, popup, email..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <button
            type="button"
            role="switch"
            aria-checked={onlyRepeat}
            aria-label="Chỉ client đăng ký nhiều lần"
            onClick={() => setOnlyRepeat((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
              onlyRepeat ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                onlyRepeat ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Chỉ client đăng ký nhiều lần
          </span>
        </label>
      </div>

      {subs.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-8 text-center">
          Chưa có đăng ký nào.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-8 text-center">
          Không có đăng ký khớp với bộ lọc.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
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

                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 rounded-full px-2 py-0.5">
                    <svg
                      className="w-3 h-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                    Client {s.visitorKey}
                  </span>
                  {s.device && (
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                      {s.device}
                    </span>
                  )}
                  {s.ip && (
                    <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                      {s.ip}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-2 py-0.5 ${
                      s.repeat
                        ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10"
                        : "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/10"
                    }`}
                  >
                    Đăng ký lần {s.visitNumber}/{s.visitsTotal} của client
                  </span>
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