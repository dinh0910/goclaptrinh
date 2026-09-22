"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getVisitorId, getVisitorSignals } from "@/lib/client-visitor";
import { TextArea } from "@/components/shared/TextArea";

interface CommentItem {
  id: number;
  postId: number;
  parentId: number | null;
  userId: number;
  name: string;
  content: string;
  createdAt: string;
}

interface BlogCommentsProps {
  slug: string;
  initialComments: CommentItem[];
  initialLikeCount: number;
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const REPORT_REASONS = [
  "Spam / quảng cáo",
  "Nội dung xúc phạm, thô tục",
  "Quấy rối",
  "Không liên quan",
  "Khác",
];

export default function BlogComments({
  slug,
  initialComments,
  initialLikeCount,
}: BlogCommentsProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = status === "authenticated";
  const userName = session?.user?.name || session?.user?.email || "";

  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  // Comment form state
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendingReply, setSendingReply] = useState<number | null>(null);

  // Report state
  const [reportOpen, setReportOpen] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportNote, setReportNote] = useState("");
  const [sendingReport, setSendingReport] = useState(false);

  const loadComments = useCallback(
    () =>
      fetch(`/api/comments?slug=${encodeURIComponent(slug)}`)
        .then((r) => r.json().catch(() => null))
        .then((d) => {
          if (d && Array.isArray(d.comments)) setComments(d.comments);
        })
        .catch(() => {}),
    [slug]
  );

  // Load visitor reaction state + latest comments on mount
  useEffect(() => {
    const visitorId = getVisitorId();
    if (visitorId) {
      fetch(`/api/react?slug=${encodeURIComponent(slug)}&visitorId=${visitorId}`)
        .then((r) => r.json().catch(() => null))
        .then((d) => {
          if (d && typeof d.liked === "boolean") setLiked(d.liked);
          if (d && typeof d.count === "number") setLikeCount(d.count);
        })
        .catch(() => {});
    }
    loadComments();
  }, [slug, loadComments]);

  const toggleLike = async () => {
    const visitorId = getVisitorId();
    if (!visitorId) return;
    try {
      const res = await fetch("/api/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, visitorId, signals: getVisitorSignals(), website: "" }),
      });
      const d = await res.json();
      if (d && typeof d.liked === "boolean") setLiked(d.liked);
      if (d && typeof d.count === "number") setLikeCount(d.count);
    } catch {
      /* silent */
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          content,
          visitorId: getVisitorId(),
          signals: getVisitorSignals(),
          honeypot: "",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể gửi bình luận");
      setContent("");
      toast.success("Bình luận đã được đăng.");
      loadComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSending(false);
    }
  };

  const submitReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để phản hồi");
      return;
    }
    setSendingReply(parentId);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          content: replyContent,
          parentId,
          visitorId: getVisitorId(),
          signals: getVisitorSignals(),
          honeypot: "",
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể gửi phản hồi");
      setReplyTo(null);
      setReplyContent("");
      toast.success("Phản hồi đã được đăng.");
      loadComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSendingReply(null);
    }
  };

  const submitReport = async (commentId: number) => {
    if (!isLoggedIn) {
      toast.error("Vui lòng đăng nhập để báo cáo");
      return;
    }
    setSendingReport(true);
    try {
      const res = await fetch("/api/comments/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, reason: reportReason, note: reportNote }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể gửi báo cáo");
      setReportOpen(null);
      setReportNote("");
      setReportReason(REPORT_REASONS[0]);
      toast.success("Đã gửi báo cáo. Cảm ơn bạn!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setSendingReport(false);
    }
  };

  // Build a simple nested list (1 level)
  const list = comments.length ? comments : initialComments;
  const topLevel = list.filter((c) => !c.parentId);
  const byParent = new Map<number, CommentItem[]>();
  for (const c of list) {
    if (c.parentId) {
      const arr = byParent.get(c.parentId) ?? [];
      arr.push(c);
      byParent.set(c.parentId, arr);
    }
  }

  const callbackUrl = encodeURIComponent(pathname);

  return (
    <div className="mt-12">
      {/* Like bar */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={toggleLike}
          className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
            liked
              ? "bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30 text-red-600 dark:text-red-400"
              : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-red-200 hover:text-red-500 dark:hover:border-red-800"
          }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="text-sm font-semibold">{likeCount}</span>
        </button>
      </div>

      {/* Section heading */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Bình luận ({comments.length || initialComments.length})
        </h2>
      </div>

      {/* Comment form / login prompt */}
      {isLoggedIn ? (
        <form onSubmit={submitComment} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6">
          {/* Honeypot — hidden from humans */}
          <input type="text" tabIndex={-1} autoComplete="off" className="absolute opacity-0 pointer-events-none w-0 h-0" onChange={() => {}} value="" />
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Bình luận với tư cách <span className="text-blue-600 dark:text-blue-400">{userName}</span>
            </label>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Viết bình luận..."
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Bình luận sẽ hiển thị ngay lập tức.
            </p>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "Đang gửi..." : "Gửi bình luận"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Đăng nhập để bình luận
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Bạn cần đăng nhập trước khi có thể bình luận hoặc trả lời.
            </p>
          </div>
          <Link
            href={`/login?callbackUrl=${callbackUrl}`}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
            Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ!
          </p>
        ) : (
          topLevel.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              replies={byParent.get(c.id) ?? []}
              onReply={(id) => {
                setReplyTo(id);
                setReplyContent("");
              }}
              replyTo={replyTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              submitReply={submitReply}
              sendingReply={sendingReply}
              onCancelReply={() => setReplyTo(null)}
              reportOpen={reportOpen}
              setReportOpen={(id) => {
                setReportOpen(id);
                setReportReason(REPORT_REASONS[0]);
                setReportNote("");
              }}
              reportReason={reportReason}
              setReportReason={setReportReason}
              reportNote={reportNote}
              setReportNote={setReportNote}
              submitReport={submitReport}
              sendingReport={sendingReport}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentThread({
  comment: c,
  replies,
  onReply,
  replyTo,
  replyContent,
  setReplyContent,
  submitReply,
  sendingReply,
  onCancelReply,
  reportOpen,
  setReportOpen,
  reportReason,
  setReportReason,
  reportNote,
  setReportNote,
  submitReport,
  sendingReport,
}: {
  comment: CommentItem;
  replies: CommentItem[];
  onReply: (id: number) => void;
  replyTo: number | null;
  replyContent: string;
  setReplyContent: (v: string) => void;
  submitReply: (parentId: number) => void;
  sendingReply: number | null;
  onCancelReply: () => void;
  reportOpen: number | null;
  setReportOpen: (id: number | null) => void;
  reportReason: string;
  setReportReason: (v: string) => void;
  reportNote: string;
  setReportNote: (v: string) => void;
  submitReport: (id: number) => void;
  sendingReport: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
          {c.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            {new Date(c.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-2">{c.content}</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onReply(c.id)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Phản hồi
        </button>
        <button
          onClick={() => setReportOpen(reportOpen === c.id ? null : c.id)}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
        >
          Báo cáo
        </button>
      </div>

      {reportOpen === c.id && (
        <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
            Báo cáo bình luận này
          </p>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className={`${inputClass} mb-2`}
          >
            {REPORT_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <TextArea
            value={reportNote}
            onChange={(e) => setReportNote(e.target.value)}
            rows={2}
            className="mb-2"
            placeholder="Ghi chú thêm (tùy chọn)..."
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setReportOpen(null)}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => submitReport(c.id)}
              disabled={sendingReport}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {sendingReport ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </div>
      )}

      {replies.length > 0 && (
        <div className="mt-3 ml-6 space-y-3 border-l-2 border-gray-100 dark:border-gray-800 pl-4">
          {replies.map((r) => (
            <div key={r.id}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {new Date(r.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap ml-8 mb-1">{r.content}</p>
              <button
                onClick={() => setReportOpen(reportOpen === r.id ? null : r.id)}
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-8"
              >
                Báo cáo
              </button>
              {reportOpen === r.id && (
                <div className="mt-2 ml-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Báo cáo bình luận này
                  </p>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className={`${inputClass} mb-2`}
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <TextArea
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    rows={2}
                    className="mb-2"
                    placeholder="Ghi chú thêm (tùy chọn)..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setReportOpen(null)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => submitReport(r.id)}
                      disabled={sendingReport}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {sendingReport ? "Đang gửi..." : "Gửi báo cáo"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {replyTo === c.id && (
        <div className="mt-3 ml-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
          <TextArea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="mb-2"
            placeholder="Viết phản hồi..."
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onCancelReply}
              className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => submitReply(c.id)}
              disabled={sendingReply === c.id}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sendingReply === c.id ? "Đang gửi..." : "Gửi phản hồi"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}