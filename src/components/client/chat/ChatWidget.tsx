"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { getVisitorId, getVisitorSignals } from "@/lib/client-visitor";
import ScrollToTop from "@/components/client/ui/ScrollToTop";

interface ChatMessage {
  id: number;
  conversationId: number;
  sender: "client" | "admin";
  senderName: string;
  content: string;
  createdAt: string;
}

interface ChatState {
  conversationId: number;
  status: string;
}

/** Thông tin liên hệ bắt buộc trước khi bắt đầu chat. */
interface ChatProfile {
  name: string;
  email: string;
  phone: string;
}

const POLL_INTERVAL_MS = 5000;
const MAX_LEN = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;

// Fixed bottom-right stack. The panel is anchored just above the launcher
// (h-12 button at bottom-5 -> its top edge is 68px), so `bottom-20` leaves a
// tight 12px gap like a chat bubble. `max-h` keeps it clear of the site header
// on short viewports.
const stackClass =
  "fixed bottom-5 right-5 z-[60] flex flex-col items-center gap-3";
const launcherClass =
  "relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";
const panelClass =
  "fixed bottom-20 right-5 z-[60] flex h-[26rem] max-h-[calc(100dvh-6rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl";
const inputClass =
  "flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-h-28 min-h-[42px]";
const fieldClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const fieldLabelClass =
  "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";
const sendClass =
  "shrink-0 rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

/** Validate bằng đúng regex ở server để lỗi hiện ra ngay, không cần gọi API. */
function validateProfile(profile: ChatProfile): string | null {
  if (profile.name.trim().length < 2) return "Vui lòng nhập họ và tên";
  if (!EMAIL_RE.test(profile.email.trim())) return "Email không hợp lệ";
  if (!PHONE_RE.test(profile.phone.trim())) return "Số điện thoại không hợp lệ";
  return null;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ChatWidget() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ChatState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [honeypot, setHoneypot] = useState("");
  const [profile, setProfile] = useState<ChatProfile | null>(null);
  const [form, setForm] = useState<ChatProfile>({ name: "", email: "", phone: "" });
  const [formError, setFormError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef(0);
  // Read inside the poll callback without re-arming the interval on every toggle.
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const load = useCallback(() => {
    const visitorId = getVisitorId();
    if (!visitorId) return;
    fetch(`/api/chat?visitorId=${encodeURIComponent(visitorId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("chat"))))
      .then((data) => {
        if (data.conversation?.id) {
          setState({
            conversationId: data.conversation.id,
            status: data.conversation.status || "open",
          });
          // Hội thoại cũ đã lưu thông tin liên hệ ở server — không hỏi lại.
          if (data.conversation.name) {
            setProfile({
              name: String(data.conversation.name || ""),
              email: String(data.conversation.email || ""),
              phone: String(data.conversation.phone || ""),
            });
          }
        }
        const next: ChatMessage[] = Array.isArray(data.messages) ? data.messages : [];
        const newest = next.length > 0 ? next[next.length - 1].id : 0;
        setMessages(next);
        if (newest > lastMessageIdRef.current) {
          lastMessageIdRef.current = newest;
          if (openRef.current) {
            setUnread(0);
            scrollToBottom();
          } else {
            setUnread((n) => n + 1);
          }
        }
      })
      // Chat is non-critical — never surface polling failures to the reader.
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [scrollToBottom]);

  // Poll every 5s: cheap on SQLite, and the delay is irrelevant for support chat.
  useEffect(() => {
    if (isAdmin) return;
    load();
    const timer = window.setInterval(load, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isAdmin, load]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setUnread(0);
    requestAnimationFrame(scrollToBottom);
  };

  // Chặn ở bước xin thông tin: chưa có hồ sơ và chưa có hội thoại thì không cho
  // gõ tin nhắn, vì không có gì để liên hệ lại với khách.
  const needsProfile = !loading && !state && !profile;

  const startChat = () => {
    const error = validateProfile(form);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setProfile({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    });
    requestAnimationFrame(scrollToBottom);
  };

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;

    setSending(true);
    setDraft("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          visitorId: getVisitorId(),
          signals: getVisitorSignals(),
          name: profile?.name || form.name,
          email: profile?.email || form.email,
          phone: profile?.phone || form.phone,
          honeypot,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setDraft(content);
        toast.error(data?.error || "Không gửi được tin nhắn");
        return;
      }
      if (data.conversation?.id) {
        setState({
          conversationId: data.conversation.id,
          status: data.conversation.status || "open",
        });
      }
      if (Array.isArray(data.messages)) {
        const newest = data.messages.length > 0 ? data.messages[data.messages.length - 1].id : 0;
        lastMessageIdRef.current = Math.max(lastMessageIdRef.current, newest);
        setMessages(data.messages);
        scrollToBottom();
      }
    } catch {
      setDraft(content);
      toast.error("Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  if (isAdmin) return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Hỗ trợ trực tuyến"
          className={panelClass}
        >
          <div className="flex items-center justify-between border-b border-gray-200 bg-blue-600 px-4 py-3 text-white dark:border-gray-700">
            <div>
              <p className="text-sm font-semibold">Hỗ trợ trực tuyến</p>
              <p className="text-xs text-blue-100">
                {loading ? "Đang kết nối…" : "Thường trả lời trong vài phút"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Đóng"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {needsProfile ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startChat();
              }}
              className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-950"
            >
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Để được hỗ trợ nhanh nhất, bạn cho chúng tôi biết thông tin liên hệ
                nhé.
              </p>

              <div>
                <label htmlFor="chat-name" className={fieldLabelClass}>
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  id="chat-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Nguyễn Văn A"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="chat-email" className={fieldLabelClass}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="chat-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  maxLength={200}
                  autoComplete="email"
                  placeholder="ban@example.com"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="chat-phone" className={fieldLabelClass}>
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <input
                  id="chat-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  maxLength={32}
                  autoComplete="tel"
                  placeholder="0912 345 678"
                  className={fieldClass}
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="mt-1 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Bắt đầu chat
              </button>

              <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
                Thông tin chỉ dùng để hỗ trợ bạn qua chat, không chia sẻ cho bên
                thứ ba.
              </p>
            </form>
          ) : (
            <>
            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-950"
            >
              {messages.length === 0 && (
                <p className="pt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Xin chào{profile?.name ? ` ${profile.name}` : ""}! Bạn cứ hỏi bất
                  cứ điều gì, chúng tôi sẽ phản hồi sớm.
                </p>
              )}
              {messages.map((m) => {
                const mine = m.sender === "client";
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                        mine
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
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
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {state?.status === "closed" && (
              <p className="border-t border-gray-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:border-gray-700 dark:bg-amber-500/10 dark:text-amber-400">
                Hội thoại đã đóng. Gửi tin nhắn mới để mở lại.
              </p>
            )}

            <div className="flex items-end gap-2 border-t border-gray-200 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-900">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Nhập tin nhắn…"
                aria-label="Nội dung tin nhắn"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={!draft.trim() || sending}
                className={sendClass}
              >
                {sending ? "…" : "Gửi"}
              </button>
            </div>

          {/* Honeypot: bots fill every hidden field they find. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
          />
            </>
          )}
        </div>
      )}

      {/* Bottom-right stack: scroll-to-top sits above the chat launcher and
          steps aside while the chat panel is open so nothing is covered. */}
      <div className={stackClass}>
        <ScrollToTop hidden={open} />
        <button
          type="button"
          onClick={toggle}
          aria-label={open ? "Đóng khung chat" : "Mở khung chat"}
          aria-expanded={open}
          className={launcherClass}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 10.5h8M8 14h5M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V15h-.5A2.5 2.5 0 0 1 4 12.5v-7Z"
              />
            )}
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>
    </>
  );
}
