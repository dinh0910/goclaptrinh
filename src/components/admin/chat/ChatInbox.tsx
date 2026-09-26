"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

interface AdminConversation {
  id: number;
  userId: number;
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadForAdmin: number;
  unreadForClient: number;
  ip: string;
  signals: Record<string, unknown>;
  createdAt: string;
  messageCount: number;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  sender: "client" | "admin";
  senderName: string;
  content: string;
  createdAt: string;
}

interface Counts {
  total: number;
  open: number;
  unread: number;
}

const POLL_INTERVAL_MS = 5000;
const MAX_LEN = 2000;

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const primaryBtn =
  "px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const ghostBtn =
  "px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";
const listItemClass = (active: boolean, unread: boolean) =>
  `w-full text-left px-4 py-3 border-b border-gray-200 dark:border-gray-800 transition-colors ${
    active
      ? "bg-blue-50 dark:bg-blue-500/10"
      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
  } ${unread ? "border-l-2 border-l-blue-500" : "border-l-2 border-l-transparent"}`;

function deviceFromSignals(signals: Record<string, unknown>): string {
  const ua = String(signals.ua || "");
  const parts: string[] = [];
  if (/Edg\//i.test(ua)) parts.push("Edge");
  else if (/Chrome\/|CriOS/i.test(ua)) parts.push("Chrome");
  else if (/Firefox\/|FxiOS/i.test(ua)) parts.push("Firefox");
  else if (/Safari\//i.test(ua)) parts.push("Safari");
  else if (/OPR\//i.test(ua)) parts.push("Opera");
  if (/Windows/i.test(ua)) parts.push("Windows");
  else if (/iPhone|iPad|iPod/i.test(ua)) parts.push("iOS");
  else if (/Android/i.test(ua)) parts.push("Android");
  else if (/Mac OS X|Macintosh/i.test(ua)) parts.push("macOS");
  else if (/Linux/i.test(ua)) parts.push("Linux");
  const w = Number(signals.screenW || 0);
  const h = Number(signals.screenH || 0);
  if (w && h) parts.push(`${w}×${h}`);
  return parts.join(" · ");
}

function formatTime(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function clockTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatInbox() {
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, open: 0, unread: 0 });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);
  // Which conversation the `messages` state currently belongs to. Deriving the
  // thread from it avoids a stale flash and removes the need for a loading flag.
  const [loadedId, setLoadedId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [showTech, setShowTech] = useState(false);

  const qRef = useRef("");
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<number | null>(null);

  useEffect(() => {
    openRef.current = selectedId;
  }, [selectedId]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const loadList = useCallback(
    (opts?: { q?: string; status?: string; silent?: boolean }) => {
      const query = opts?.q ?? qRef.current;
      const filter = opts?.status ?? status;
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (filter !== "all") params.set("status", filter);
      fetch(`/api/admin/chat?${params.toString()}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Lỗi tải danh sách"))))
        .then((data) => {
          const rows: AdminConversation[] = data.rows || [];
          setConversations(rows);
          setCounts(data.counts || { total: 0, open: 0, unread: 0 });
          // Auto-select the first row so the pane is never empty on desktop.
          setSelectedId((prev) => {
            if (prev && rows.some((r) => r.id === prev)) return prev;
            return rows.length > 0 ? rows[0].id : null;
          });
        })
        .catch((e) => {
          // Polling every 5s must not spam the operator with toasts.
          if (!opts?.silent) {
            toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách");
          }
        })
        .finally(() => setLoading(false));
    },
    [status]
  );

  const loadThread = useCallback(
    (id: number, opts?: { silent?: boolean }) => {
      fetch(`/api/admin/chat?id=${id}`, { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Lỗi tải hội thoại"))))
        .then((data) => {
          const next: ChatMessage[] = data.messages || [];
          setMessages(next);
          setLoadedId(id);
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, unreadForAdmin: 0 } : c))
          );
          requestAnimationFrame(scrollToBottom);
        })
        .catch((e) => {
          if (!opts?.silent) {
            toast.error(e instanceof Error ? e.message : "Lỗi tải hội thoại");
          }
        });
    },
    [scrollToBottom]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) loadThread(selectedId);
  }, [selectedId, loadThread]);

  // Poll the list for new activity, and the open thread for new messages.
  // Self-rescheduling timeout instead of setInterval: a slow response can never
  // stack up overlapping requests, and the delay is measured from the last
  // finished poll rather than from an arbitrary fixed grid.
  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    const tick = () => {
      if (cancelled) return;
      if (!document.hidden) {
        loadList({ silent: true });
        const id = openRef.current;
        if (id) loadThread(id, { silent: true });
      }
      timer = window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    timer = window.setTimeout(tick, POLL_INTERVAL_MS);

    // Coming back to the tab must not leave a stale inbox: refetch right away
    // instead of making the operator wait out the remaining interval.
    const onWake = () => {
      if (cancelled || document.hidden) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(tick, 0);
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [loadList, loadThread]);

  const selected = conversations.find((c) => c.id === selectedId) || null;
  // Only show messages once they belong to the selected conversation, so
  // switching rows never flashes the previous thread.
  const thread = loadedId === selectedId ? messages : [];
  const threadLoading = selectedId !== null && loadedId !== selectedId;

  useEffect(() => {
    scrollToBottom();
  }, [thread.length, scrollToBottom]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !selectedId || sending) return;

    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không gửi được");
      if (Array.isArray(data.messages)) setMessages(data.messages);
      loadList({ silent: true });
    } catch (e) {
      setDraft(content);
      toast.error(e instanceof Error ? e.message : "Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (next: "open" | "closed") => {
    if (!selectedId) return;
    try {
      const res = await fetch("/api/admin/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật");
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, status: next } : c))
      );
      toast.success(next === "closed" ? "Đã đóng hội thoại" : "Đã mở lại hội thoại");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật");
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    setConfirmBusy(true);
    try {
      const res = await fetch(`/api/admin/chat?id=${pendingDelete}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xóa");
      toast.success("Đã xóa hội thoại");
      setPendingDelete(null);
      setSelectedId(null);
      loadList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa");
    } finally {
      setConfirmBusy(false);
    }
  };

  if (loading) return <LoadingScreen label="Đang tải tin nhắn..." />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: "Tất cả", count: counts.total },
              { key: "open", label: "Đang mở", count: counts.open },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setStatus(tab.key);
                qRef.current = q;
                loadList({ status: tab.key });
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                status === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
          {counts.unread > 0 && (
            <span className="self-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {counts.unread} chưa đọc
            </span>
          )}
        </div>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            qRef.current = e.target.value;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") loadList();
          }}
          placeholder="Tìm theo tên, email, nội dung…"
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[20rem_1fr]">
        {/* Danh sách hội thoại */}
        <div className="max-h-[70dvh] overflow-y-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {conversations.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Chưa có hội thoại nào.
            </p>
          ) : (
            conversations.map((c) => {
              const device = deviceFromSignals(c.signals);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    setShowTech(false);
                  }}
                  className={listItemClass(c.id === selectedId, c.unreadForAdmin > 0)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        c.unreadForAdmin > 0
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "font-medium text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {c.name || c.email || "Khách vô danh"}
                    </p>
                    <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                      {formatTime(c.lastMessageAt || c.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {c.lastMessagePreview || "Chưa có tin nhắn"}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-gray-400 dark:text-gray-500">
                    {c.messageCount} tin · {c.status === "closed" ? "Đã đóng" : "Đang mở"}
                    {device ? ` · ${device}` : ""}
                  </p>
                </button>
              );
            })
          )}
        </div>

        {/* Thread */}
        <div className="flex max-h-[70dvh] min-h-[24rem] flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {!selected ? (
            <p className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Chọn một hội thoại để xem tin nhắn.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {selected.name || selected.email || "Khách vô danh"}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    <a
                      href={`mailto:${selected.email}`}
                      className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                    >
                      {selected.email || "Không có email"}
                    </a>
                    {selected.phone && (
                      <>
                        <span aria-hidden="true">·</span>
                        <a
                          href={`tel:${selected.phone.replace(/\s/g, "")}`}
                          className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        >
                          {selected.phone}
                        </a>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>Bắt đầu {formatTime(selected.createdAt)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTech((v) => !v)}
                    aria-expanded={showTech}
                    className={ghostBtn}
                  >
                    {showTech ? "Ẩn thông tin kỹ thuật" : "Thông tin kỹ thuật"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void changeStatus(selected.status === "closed" ? "open" : "closed")
                    }
                    className={ghostBtn}
                  >
                    {selected.status === "closed" ? "Mở lại" : "Đóng hội thoại"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(selected.id)}
                    className={`${ghostBtn} text-red-600 dark:text-red-400`}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {showTech && (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs dark:border-gray-800 dark:bg-gray-800/40 sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">IP</dt>
                    <dd className="font-mono text-gray-800 dark:text-gray-200">
                      {selected.ip || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">Thiết bị</dt>
                    <dd className="text-gray-800 dark:text-gray-200">
                      {deviceFromSignals(selected.signals) || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">Múi giờ</dt>
                    <dd className="text-gray-800 dark:text-gray-200">
                      {String(selected.signals.tz || "—")}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-gray-500 dark:text-gray-400">Visitor ID</dt>
                    <dd className="truncate font-mono text-gray-800 dark:text-gray-200">
                      {selected.visitorId || "—"}
                    </dd>
                  </div>
                  <p className="sm:col-span-2 text-[11px] text-gray-500 dark:text-gray-400">
                    IP đã che một phần. Dùng để phân biệt khách thật với bot khi có nghi vấn
                    spam.
                  </p>
                </dl>
              )}

              <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {threadLoading && thread.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">Đang tải…</p>
                ) : thread.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Chưa có tin nhắn nào.
                  </p>
                ) : (
                  thread.map((m) => {
                    const mine = m.sender === "admin";
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                            mine
                              ? "bg-blue-600 text-white"
                              : "border border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                          }`}
                        >
                          {!mine && m.senderName && (
                            <p className="mb-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                              {m.senderName}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              mine ? "text-blue-100" : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {clockTime(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex items-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={2}
                  placeholder="Trả lời khách… (Enter để gửi, Shift+Enter xuống dòng)"
                  className={`${inputClass} resize-none`}
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={!draft.trim() || sending}
                  className={primaryBtn}
                >
                  {sending ? "…" : "Gửi"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Xóa hội thoại?"
        message="Toàn bộ tin nhắn của hội thoại này sẽ bị xóa vĩnh viễn. Không thể hoàn tác."
        confirmLabel="Xóa"
        danger
        loading={confirmBusy}
        onConfirm={() => void remove()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
