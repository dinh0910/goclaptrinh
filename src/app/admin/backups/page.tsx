"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

interface BackupMeta {
  filename: string;
  size: number;
  createdAt: number;
}

const INTERVALS = [
  { value: 0, label: "Tắt tự động" },
  { value: 6, label: "Mỗi 6 giờ" },
  { value: 24, label: "Mỗi ngày" },
  { value: 72, label: "Mỗi 3 ngày" },
  { value: 168, label: "Mỗi tuần" },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function AdminBackupsPage() {
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [intervalHours, setIntervalHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/backups")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách backup");
        return res.json() as Promise<{
          backups: BackupMeta[];
          intervalHours: number;
        }>;
      })
      .then((data) => {
        setBackups(data.backups);
        setIntervalHours(data.intervalHours);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backups");
      if (!res.ok) throw new Error("Không thể tải danh sách backup");
      const data = (await res.json()) as {
        backups: BackupMeta[];
        intervalHours: number;
      };
      setBackups(data.backups);
      setIntervalHours(data.intervalHours);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    }
  }, []);

  const create = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      if (!res.ok) throw new Error("Không thể tạo backup");
      toast.success("Đã tạo backup");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const saveInterval = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "interval", hours: intervalHours }),
      });
      if (!res.ok) throw new Error("Không thể lưu cài đặt");
      toast.success("Đã lưu cài đặt");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async (filename: string) => {
    if (
      !window.confirm(
        `Khôi phục dữ liệu từ ${filename}?\nToàn bộ dữ liệu hiện tại sẽ được thay thế bằng bản backup này.`
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", filename }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Không thể khôi phục backup");
      }
      toast.success("Đã khôi phục backup");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (filename: string) => {
    if (!window.confirm(`Xóa backup ${filename}?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", filename }),
      });
      if (!res.ok) throw new Error("Không thể xóa backup");
      toast.success("Đã xóa backup");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Sao lưu dữ liệu" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sao lưu dữ liệu
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tạo và quản lý các bản sao lưu cơ sở dữ liệu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Tạo backup ngay
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tạo bản sao lưu thủ công tại thời điểm hiện tại.
          </p>
          <button
            type="button"
            onClick={create}
            disabled={busy}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {busy ? "Đang xử lý..." : "Tạo backup"}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tự động hóa
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Backup được tạo tự động khi khởi động server nếu đã đến hạn.
            </p>
            <select
              value={intervalHours}
              onChange={(e) => setIntervalHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              {INTERVALS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveInterval}
              disabled={busy}
              className="mt-3 w-full px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Lưu cài đặt
            </button>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Danh sách backup ({backups.length})
            </h2>
          </div>

          {loading ? (
            <LoadingScreen label="Đang tải danh sách backup..." compact />
          ) : backups.length === 0 ? (
            <p className="p-8 text-center text-sm text-gray-400">
              Chưa có backup nào.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {backups.map((b) => (
                <li
                  key={b.filename}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
                      {b.filename}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(b.createdAt).toLocaleString("vi-VN")} ·{" "}
                      {formatBytes(b.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => doRestore(b.filename)}
                    disabled={busy}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 transition-colors"
                  >
                    Khôi phục
                  </button>
                  <button
                    type="button"
                    onClick={() => doDelete(b.filename)}
                    disabled={busy}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}