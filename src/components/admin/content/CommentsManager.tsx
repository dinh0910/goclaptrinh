"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AdminComment {
  id: number;
  postId: number;
  parentId: number | null;
  name: string;
  email: string;
  content: string;
  status: string;
  createdAt: string;
  postTitle: string;
  postSlug: string;
}

interface Counts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function CommentsManager() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const qRef = useRef("");

  const load = useCallback((status: string, search?: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("q", search);
    fetch(`/api/admin/comments?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Lỗi tải dữ liệu"))))
      .then((d) => {
        setComments(d.rows || []);
        setCounts(d.counts || { total: 0, pending: 0, approved: 0, rejected: 0 });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(tab, qRef.current);
  }, [tab, load]);

  const search = () => load(tab, qRef.current);

  const act = async (action: string, id: number) => {
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Lỗi thao tác");
      toast.success(action === "approve" ? "Đã duyệt" : action === "reject" ? "Đã từ chối" : "Đã xóa");
      load(tab, qRef.current);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  };

  const remove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Lỗi xóa");
      toast.success("Đã xóa bình luận");
      load(tab, qRef.current);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    }
  };

  const tabs = [
    { key: "pending" as const, label: "Chờ duyệt", count: counts.pending },
    { key: "approved" as const, label: "Đã duyệt", count: counts.approved },
    { key: "rejected" as const, label: "Từ chối", count: counts.rejected },
    { key: "all" as const, label: "Tất cả", count: counts.total },
  ];

  return (
    <div className="space-y-4">
      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-xs ${tab === t.key ? "text-blue-200" : "text-gray-400"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); qRef.current = e.target.value; }}
            onKeyDown={(e) => e.key === "Enter" && search()}
            className={`${inputClass} sm:w-48`}
            placeholder="Tìm tên, email, nội dung..."
          />
          <button
            onClick={search}
            className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Tìm
          </button>
        </div>
      </div>

      {loading && comments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Đang tải...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Không có bình luận nào</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{c.email}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        c.status === "approved"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : c.status === "rejected"
                            ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                      }`}
                    >
                      {c.status === "approved" ? "Đã duyệt" : c.status === "rejected" ? "Bị từ chối" : "Chờ duyệt"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(c.createdAt).toLocaleString("vi-VN")} ·{" "}
                    <a href={`/blog/${c.postSlug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {c.postTitle || c.postSlug}
                    </a>
                  </p>
                  {c.parentId && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                      Phản hồi cho bình luận #{c.parentId}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{c.content}</p>
                </div>

                <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-shrink-0">
                  {c.status !== "approved" && (
                    <button
                      onClick={() => act("approve", c.id)}
                      className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                    >
                      Duyệt
                    </button>
                  )}
                  {c.status !== "rejected" && (
                    <button
                      onClick={() => act("reject", c.id)}
                      className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Từ chối
                    </button>
                  )}
                  <button
                    onClick={() => remove(c.id)}
                    className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}