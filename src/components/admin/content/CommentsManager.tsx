"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

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
  approved: number;
  rejected: number;
}

interface AdminReport {
  id: number;
  commentId: number;
  reason: string;
  note: string;
  status: string;
  createdAt: string;
  commentContent: string;
  commenterName: string;
  commenterEmail: string;
  commentStatus: string;
  reporterName: string;
  reporterEmail: string;
  postTitle: string;
  postSlug: string;
}

interface ReportCounts {
  total: number;
  pending: number;
  resolved: number;
  ignored: number;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function CommentsManager() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, approved: 0, rejected: 0 });
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [reportCounts, setReportCounts] = useState<ReportCounts>({ total: 0, pending: 0, resolved: 0, ignored: 0 });
  const [tab, setTab] = useState<"approved" | "rejected" | "all">("all");
  const [reportTab, setReportTab] = useState<"pending" | "resolved" | "ignored" | "all">("pending");
  const [mode, setMode] = useState<"comments" | "reports">("comments");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const qRef = useRef("");

  type PendingAction =
    | { kind: "reject"; id: number }
    | { kind: "deleteComment"; id: number }
    | { kind: "reportResolve"; id: number }
    | { kind: "reportIgnore"; id: number }
    | { kind: "deleteReport"; id: number; deleteComment?: boolean };
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const executePending = async () => {
    if (!pending) return;
    setConfirmBusy(true);
    try {
      if (pending.kind === "reportResolve" || pending.kind === "reportIgnore") {
        const action = pending.kind === "reportResolve" ? "resolve" : "ignore";
        const res = await fetch("/api/admin/comments/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, id: pending.id }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Lỗi thao tác");
        toast.success(action === "resolve" ? "Đã đánh dấu xử lý" : "Đã bỏ qua");
        loadReports(reportTab, qRef.current);
      } else if (pending.kind === "deleteReport") {
        const res = await fetch(
          `/api/admin/comments/reports?id=${pending.id}${pending.deleteComment ? "&deleteComment=1" : ""}`,
          { method: "DELETE" }
        );
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Lỗi xóa");
        toast.success(pending.deleteComment ? "Đã xóa báo cáo và bình luận" : "Đã xóa báo cáo");
        loadReports(reportTab, qRef.current);
        if (mode === "comments") loadComments(tab, qRef.current);
      } else if (pending.kind === "reject") {
        const res = await fetch("/api/admin/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", id: pending.id }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Lỗi thao tác");
        toast.success("Đã từ chối");
        loadComments(tab, qRef.current);
      } else if (pending.kind === "deleteComment") {
        const res = await fetch(`/api/admin/comments?id=${pending.id}`, { method: "DELETE" });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Lỗi xóa");
        toast.success("Đã xóa bình luận");
        loadComments(tab, qRef.current);
      }
      setPending(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setConfirmBusy(false);
    }
  };

  const loadComments = useCallback((status: string, search?: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("q", search);
    fetch(`/api/admin/comments?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Lỗi tải dữ liệu"))))
      .then((d) => {
        setComments(d.rows || []);
        setCounts(d.counts || { total: 0, approved: 0, rejected: 0 });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, []);

  const loadReports = useCallback((status: string, search?: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (search) params.set("q", search);
    fetch(`/api/admin/comments/reports?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Lỗi tải dữ liệu"))))
      .then((d) => {
        setReports(d.rows || []);
        setReportCounts(d.counts || { total: 0, pending: 0, resolved: 0, ignored: 0 });
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mode === "comments") loadComments(tab, qRef.current);
    else loadReports(reportTab, qRef.current);
  }, [mode, tab, reportTab, loadComments, loadReports]);

  const search = () =>
    mode === "comments" ? loadComments(tab, qRef.current) : loadReports(reportTab, qRef.current);

  const tabs = [
    { key: "approved" as const, label: "Đã duyệt", count: counts.approved },
    { key: "rejected" as const, label: "Từ chối", count: counts.rejected },
    { key: "all" as const, label: "Tất cả", count: counts.total },
  ];

  const reportTabs = [
    { key: "pending" as const, label: "Chờ xử lý", count: reportCounts.pending },
    { key: "resolved" as const, label: "Đã xử lý", count: reportCounts.resolved },
    { key: "ignored" as const, label: "Đã bỏ qua", count: reportCounts.ignored },
    { key: "all" as const, label: "Tất cả", count: reportCounts.total },
  ];

  return (
    <>
      <div className="space-y-4">
      {/* Mode switch */}
      <div className="flex gap-1">
        <button
          onClick={() => setMode("comments")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "comments"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Bình luận
        </button>
        <button
          onClick={() => setMode("reports")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "reports"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          Báo cáo
          {reportCounts.pending > 0 && (
            <span className={`ml-1.5 text-xs ${mode === "reports" ? "text-blue-200" : "text-red-400"}`}>
              {reportCounts.pending}
            </span>
          )}
        </button>
      </div>

      {/* Search + tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 flex-wrap">
          {mode === "comments"
            ? tabs.map((t) => (
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
              ))
            : reportTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setReportTab(t.key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    reportTab === t.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span className={`ml-1.5 text-xs ${reportTab === t.key ? "text-blue-200" : "text-gray-400"}`}>
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
            placeholder="Tìm kiếm..."
          />
          <button
            onClick={search}
            className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Tìm
          </button>
        </div>
      </div>

      {loading && ((mode === "comments" ? comments.length : reports.length) === 0) ? (
        <LoadingScreen label="Đang tải bình luận..." compact />
      ) : mode === "comments" ? (
        comments.length === 0 ? (
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
                            : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                        }`}
                      >
                        {c.status === "approved" ? "Đã duyệt" : "Bị từ chối"}
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
                    {c.status !== "rejected" && (
                      <button
                        onClick={() => setPending({ kind: "reject", id: c.id })}
                        className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Từ chối
                      </button>
                    )}
                    <button
                      onClick={() => setPending({ kind: "deleteComment", id: c.id })}
                      className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">Không có báo cáo nào</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">{r.reason}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                          : r.status === "resolved"
                            ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {r.status === "pending" ? "Chờ xử lý" : r.status === "resolved" ? "Đã xử lý" : "Đã bỏ qua"}
                    </span>
                    {r.commentStatus === "rejected" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                        Bình luận đã bị từ chối
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {new Date(r.createdAt).toLocaleString("vi-VN")} · Người báo cáo: {r.reporterName}
                  </p>
                  {r.postSlug && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Bài viết:{" "}
                      <a href={`/blog/${r.postSlug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {r.postTitle || r.postSlug}
                      </a>
                    </p>
                  )}
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Bình luận của <span className="font-medium">{r.commenterName}</span> ({r.commenterEmail}):
                    </p>
                    <p className="mt-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{r.commentContent}</p>
                  </div>
                  {r.note && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Ghi chú:</span> {r.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-shrink-0 flex-wrap sm:flex-nowrap">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => setPending({ kind: "reportResolve", id: r.id })}
                        className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                      >
                        Đã xử lý
                      </button>
                      <button
                        onClick={() => setPending({ kind: "reportIgnore", id: r.id })}
                        className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Bỏ qua
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setPending({ kind: "deleteReport", id: r.id, deleteComment: true })}
                    className="px-2 py-1 text-xs font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Xóa bình luận
                  </button>
                  <button
                    onClick={() => setPending({ kind: "deleteReport", id: r.id })}
                    className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Xóa báo cáo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>

      {pending && (
        <ConfirmDialog
          open={true}
          title={
            pending.kind === "reject"
              ? "Từ chối bình luận"
              : pending.kind === "deleteComment"
                ? "Xóa bình luận"
                : pending.kind === "reportResolve"
                  ? "Đánh dấu đã xử lý"
                  : pending.kind === "reportIgnore"
                    ? "Bỏ qua báo cáo"
                    : pending.deleteComment
                      ? "Xóa bình luận và báo cáo"
                      : "Xóa báo cáo"
          }
          message={
            pending.kind === "reject"
              ? "Bạn có chắc muốn từ chối bình luận này? Bình luận sẽ bị ẩn khỏi bài viết."
              : pending.kind === "deleteComment"
                ? "Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác."
                : pending.kind === "reportResolve"
                  ? "Xác nhận báo cáo này đã được xử lý?"
                  : pending.kind === "reportIgnore"
                    ? "Bạn có chắc muốn bỏ qua báo cáo này?"
                    : pending.deleteComment
                      ? "Bạn có chắc muốn xóa bình luận và cả báo cáo này? Hành động này không thể hoàn tác."
                      : "Bạn có chắc muốn xóa báo cáo này? Hành động này không thể hoàn tác."
          }
          confirmLabel={
            pending.kind === "reject"
              ? "Từ chối"
              : pending.kind === "reportResolve"
                ? "Đã xử lý"
                : pending.kind === "reportIgnore"
                  ? "Bỏ qua"
                  : "Xóa"
          }
          cancelLabel="Hủy"
          danger={pending.kind !== "reportResolve" && pending.kind !== "reportIgnore"}
          loading={confirmBusy}
          onConfirm={executePending}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}