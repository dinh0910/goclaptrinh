"use client";

import { useEffect, useState } from "react";

interface AuditRow {
  id: number;
  userId: number | null;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  detail: Record<string, unknown>;
  ip: string;
  createdAt: string;
}

const ACTION_LABELS: Record<string, string> = {
  "login.success": "Đăng nhập",
  "login.failed": "Đăng nhập thất bại",
  logout: "Đăng xuất",
  "mfa.setup": "Bật 2FA",
  "mfa.disable": "Tắt 2FA",
  "post.create": "Tạo bài viết",
  "post.update": "Sửa bài viết",
  "post.delete": "Xóa bài viết",
  "category.create": "Tạo danh mục",
  "category.update": "Sửa danh mục",
  "category.delete": "Xóa danh mục",
  "user.create": "Tạo người dùng",
  "user.update": "Sửa người dùng",
  "user.delete": "Xóa người dùng",
  "user.reset-password": "Đặt lại mật khẩu",
  "role.create": "Tạo vai trò",
  "role.update": "Sửa vai trò",
  "role.delete": "Xóa vai trò",
  "media.create": "Tải lên media",
  "media.update": "Sửa media",
  "media.delete": "Xóa media",
  "backup.create": "Tạo backup",
  "backup.delete": "Xóa backup",
  "backup.restore": "Khôi phục backup",
};

function actionColor(action: string) {
  if (action.includes("failed")) return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10";
  if (action.includes("delete")) return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10";
  if (action.includes("create") || action.includes("setup")) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
  if (action.includes("update") || action.startsWith("login.")) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10";
  return "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/40";
}

export default function AdminAuditPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (action) params.set("action", action);
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/admin/audit?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải nhật ký");
        return res.json() as Promise<{ rows: AuditRow[]; total: number }>;
      })
      .then((data) => {
        setRows(data.rows);
        setTotal(data.total);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [page, action, q]);

  const totalPages = Math.max(Math.ceil(total / 30), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nhật ký hoạt động
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ghi lại mọi hành động quan trọng của admin trên hệ thống.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo email, thực thể, ID..."
          className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <option value="">Tất cả hành động</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-400">Đang tải...</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-400">
            Chưa có bản ghi nào.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">Thời gian</th>
                  <th className="px-4 py-3 font-medium">Hành động</th>
                  <th className="px-4 py-3 font-medium">Người thực hiện</th>
                  <th className="px-4 py-3 font-medium">Thực thể</th>
                  <th className="px-4 py-3 font-medium">Chi tiết</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 dark:border-gray-800/60 last:border-0"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionColor(r.action)}`}
                      >
                        {ACTION_LABELS[r.action] ?? r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {r.userEmail || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 dark:text-gray-400">
                        {r.entity}
                      </span>
                      {r.entityId && (
                        <span className="ml-1.5 font-mono text-xs text-gray-700 dark:text-gray-300">
                          {r.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <code className="text-xs text-gray-500 dark:text-gray-400 block truncate">
                        {Object.keys(r.detail).length
                          ? JSON.stringify(r.detail)
                          : ""}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">
                      {r.ip || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500 dark:text-gray-400">
            Trang {page} / {totalPages} · {total} bản ghi
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}