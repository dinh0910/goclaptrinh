"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { NewsletterSubscriber, NewsletterCampaign } from "@/lib/newsletter";
import { TextArea } from "@/components/shared/TextArea";
import FieldSelect from "@/components/admin/ui/FieldSelect";
import {
  MAIL_PROVIDER_OPTIONS,
  type MailProvider,
} from "@/lib/mailProviders";

interface NewsletterData {
  config: { provider: MailProvider; hasKey: boolean; from: string; fromName: string };
  counts: { active: number; total: number };
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
}

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function NewsletterManager({ adminEmail }: { adminEmail: string }) {
  const [data, setData] = useState<NewsletterData | null>(null);
  const [provider, setProvider] = useState<MailProvider>("resend");
  const [from, setFrom] = useState("");
  const [fromName, setFromName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [testTo, setTestTo] = useState(adminEmail);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; total: number; failed: number } | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/newsletter")
      .then((res) => (res.ok ? (res.json() as Promise<NewsletterData>) : Promise.reject(new Error("Không thể tải dữ liệu"))))
      .then((d) => {
        setData(d);
        setProvider(d.config.provider as MailProvider);
        setFrom(d.config.from);
        setFromName(d.config.fromName);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu"));
  }, []);

  const reload = () => {
    fetch("/api/admin/newsletter")
      .then((res) => (res.ok ? (res.json() as Promise<NewsletterData>) : Promise.reject(new Error("Không thể tải lại"))))
      .then((d) => setData(d))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu"));
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey: apiKey || null, from, fromName }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể lưu");
      setApiKey("");
      setData((prev) => (prev ? { ...prev, config: d.config } : prev));
      toast.success("Đã lưu cấu hình email");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi khi lưu");
    } finally {
      setSaving(false);
    }
  };

  const syncWelcome = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "syncWelcome" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể đồng bộ");
      toast.success(`Đã đồng bộ thêm ${d.added} email từ popup`);
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi đồng bộ");
    } finally {
      setSyncing(false);
    }
  };

  const addSubscriber = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể thêm");
      setNewEmail("");
      toast.success(d.exists ? "Email đã có trong danh sách" : "Đã thêm người nhận");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi thêm người nhận");
    } finally {
      setAdding(false);
    }
  };

  const removeSubscriber = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: "DELETE" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể xóa");
      toast.success("Đã xóa người nhận");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa");
    }
  };

  const sendTest = async () => {
    if (!testTo.trim()) {
      toast.error("Nhập email nhận thử");
      return;
    }
    setSending(true);
    setProgress(null);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html: content, text: content, testTo: testTo.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Không thể gửi thử");
      toast.success("Đã gửi email thử thành công");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi gửi thử");
    } finally {
      setSending(false);
    }
  };

  const sendAll = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setSending(true);
    setProgress({ sent: 0, total: 0, failed: 0 });
    try {
      let offset = 0;
      for (;;) {
        const res = await fetch("/api/admin/newsletter/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject, html: content, text: content, offset }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Lỗi gửi");
        offset = d.nextOffset;
        setProgress((p) => ({
          sent: (p?.sent ?? 0) + d.sent,
          total: d.total,
          failed: (p?.failed ?? 0) + d.failed,
        }));
        if (d.done) {
          if (d.failed > 0) toast.warning(`Đã gửi xong: ${d.sent} thành công, ${d.failed} lỗi`);
          else toast.success(`Đã gửi xong cho ${d.sent} người nhận`);
          break;
        }
      }
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi gửi");
    } finally {
      setSending(false);
    }
  };

  const masked = data?.config.hasKey ? "••••••••••••••••" : "";
  const sourceLabel = (s: string) =>
    s === "welcome" ? "Popup" : s === "manual" ? "Thủ công" : "Trang chủ";

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cài đặt gửi email</h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nhà cung cấp</label>
              <FieldSelect
                value={provider}
                onChange={(v) => setProvider(v as MailProvider)}
                options={MAIL_PROVIDER_OPTIONS}
                className="w-full"
              />
              {provider === "google" && (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Dùng tài khoản Gmail / Google Workspace. Kích hoạt 2 lớp xác minh rồi tạo{" "}
                  <span className="text-gray-600 dark:text-gray-400">mật khẩu ứng dụng</span> (App
                  Password) và dán vào ô API Key bên dưới. Email gửi phải đúng địa chỉ tài khoản.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                API Key {data?.config.hasKey && <span className="text-xs text-gray-400">(đang có: {masked})</span>}
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={inputClass}
                placeholder={data?.config.hasKey ? "Để trống nếu giữ nguyên key cũ" : "Nhập API key..."}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email gửi (From)</label>
              <input
                type="email"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputClass}
                placeholder="hello@goclaptrinh.io.vn"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên hiển thị</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className={inputClass}
                placeholder="Góc Lập Trình"
              />
            </div>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu..." : "Lưu cấu hình"}
          </button>
        </div>
      </div>

      {/* Compose */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Soạn bản tin</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tiêu đề</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
              placeholder="【Mới】Bài viết trong tuần: ..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nội dung (HTML)</label>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="<h2>Xin chào!</h2><p>Nội dung bản tin...</p>"
            />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Phần chân email có sẵn liên kết &quot;Hủy đăng ký&quot; cho từng người nhận.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email nhận thử</label>
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              onClick={sendTest}
              disabled={sending || !data?.config.hasKey}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {sending ? "Đang gửi..." : "Gửi thử"}
            </button>
            <button
              onClick={sendAll}
              disabled={sending || !data?.config.hasKey}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "Đang gửi..." : `Gửi tất cả (${data?.counts.active ?? 0})`}
            </button>
          </div>

          {progress && (
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Tiến trình: đã gửi {progress.sent}{progress.total ? ` / ${progress.total}` : ""} người nhận
                {progress.failed > 0 && ` — ${progress.failed} lỗi`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Campaigns */}
      {data && data.campaigns.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lịch sử gửi</h2>
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.sentAt).toLocaleString("vi-VN")} · {c.total} người · {c.ok} ok
                    {c.failed > 0 && ` · ${c.failed} lỗi`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscribers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Người nhận ({data?.counts.active ?? 0} / {data?.counts.total ?? 0})
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={`${inputClass} sm:w-56`}
              placeholder="them@email.com"
            />
            <button
              onClick={addSubscriber}
              disabled={adding}
              className="px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {adding ? "Đang thêm..." : "Thêm"}
            </button>
            <button
              onClick={syncWelcome}
              disabled={syncing}
              className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {syncing ? "Đang đồng bộ..." : "Đồng bộ từ popup"}
            </button>
          </div>
        </div>
        {!data || data.subscribers.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Chưa có người nhận. Nhấn &quot;Đồng bộ từ popup&quot; để kéo email từ các form giới thiệu, hoặc nhấn &quot;Thêm&quot; để thêm thủ công.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Nguồn</th>
                  <th className="py-2 pr-4">Đăng ký lúc</th>
                  <th className="py-2 pr-4">Trạng thái</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.slice(0, 100).map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="py-2 pr-4 text-gray-900 dark:text-gray-200">{s.email}</td>
                    <td className="py-2 pr-4">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                        {sourceLabel(s.source)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">
                      {new Date(s.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-2 pr-4">
                      {s.unsubscribed ? (
                        <span className="text-xs text-orange-600 dark:text-orange-400">Đã hủy</span>
                      ) : (
                        <span className="text-xs text-green-600 dark:text-green-400">Hoạt động</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => removeSubscriber(s.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}