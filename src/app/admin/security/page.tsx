"use client";

import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

interface MfaStatus {
  enabled: boolean;
  email: string;
  issuer: string;
}

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mfa");
      if (!res.ok) throw new Error("Không thể tải trạng thái bảo mật");
      setStatus((await res.json()) as MfaStatus);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/mfa")
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải trạng thái bảo mật");
        return res.json() as Promise<MfaStatus>;
      })
      .then((data) => setStatus(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setup = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup", code: "000000" }),
      });
      const data = (await res.json()) as { secret?: string; uri?: string; error?: string };
      if (!res.ok || !data.secret || !data.uri) {
        throw new Error(data.error || "Không thể tạo mã QR");
      }
      setSecret(data.secret);
      setUri(data.uri);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const enable = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Vui lòng nhập mã 6 số");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enable", code: code.trim(), secret }),
      });
      const data = (await res.json()) as { enabled?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể kích hoạt");
      toast.success("Đã bật xác thực hai lớp");
      setSecret("");
      setUri("");
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      toast.error("Vui lòng nhập mã 6 số hiện tại");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disable", code: code.trim() }),
      });
      const data = (await res.json()) as { enabled?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error || "Không thể tắt");
      toast.success("Đã tắt xác thực hai lớp");
      setCode("");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Đang tải cấu hình bảo mật..." />;
  }

  return (
    <div className="max-w-2xl">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Bảo mật" },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảo mật</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Xác thực hai lớp (2FA) bằng mã TOTP — Google Authenticator, Authy, Microsoft
          Authenticator, 1Password...
        </p>
      </div>

      {status?.enabled ? (
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Đang bật
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tài khoản {status.email} yêu cầu mã xác thực khi đăng nhập.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Tắt xác thực hai lớp
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Nhập mã 6 số hiện tại từ ứng dụng xác thực để tắt.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-40 px-4 py-2.5 text-center tracking-[0.3em] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
              />
              <button
                type="button"
                onClick={disable}
                disabled={busy || code.length !== 6}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "Đang xử lý..." : "Tắt 2FA"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Bật xác thực hai lớp
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Quét mã QR bằng ứng dụng xác thực, sau đó nhập mã 6 số để xác minh.
          </p>

          {!uri ? (
            <button
              type="button"
              onClick={setup}
              disabled={busy}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Đang tạo..." : "Tạo mã QR"}
            </button>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="p-4 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800">
                  <QRCodeSVG value={uri} size={180} level="M" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    Không quét được? Nhập mã thủ công
                  </h3>
                  <code className="block px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 break-all select-all">
                    {secret}
                  </code>
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Tài khoản: <b>{status?.email}</b> · Nhà phát hành: <b>{status?.issuer}</b>
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                  Mã xác thực 6 số
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-40 px-4 py-2.5 text-center tracking-[0.3em] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={enable}
                disabled={busy || code.length !== 6}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "Đang xác minh..." : "Kích hoạt 2FA"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}