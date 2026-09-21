"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function checkCredentials(
    email: string,
    password: string
  ): Promise<{ ok: boolean; mfaRequired: boolean }> {
    const res = await fetch("/api/auth/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      toast.error("Email hoặc mật khẩu không đúng");
      return { ok: false, mfaRequired: false };
    }
    const data = (await res.json()) as { ok: boolean; mfaRequired?: boolean };
    if (data.mfaRequired) setMfaRequired(true);
    return { ok: true, mfaRequired: !!data.mfaRequired };
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const totp = (formData.get("totp") as string) || "";

    // Step 1: verify email + password, discover whether TOTP is needed.
    if (!mfaRequired) {
      const { ok, mfaRequired: needMfa } = await checkCredentials(email, password);
      if (!ok) {
        setLoading(false);
        return;
      }
      // Cần mã xác thực: dừng ở bước này, form sẽ hiện ô nhập TOTP.
      if (needMfa) {
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email,
      password,
      totp,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      if (mfaRequired) {
        toast.error("Mã xác thực không đúng hoặc đã hết hạn");
      } else {
        toast.error("Email hoặc mật khẩu không đúng");
      }
      return;
    }

    toast.success("Đăng nhập thành công");
    // Chỉ cho phép redirect nội bộ để tránh open redirect.
    const safeCallback =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : null;
    if (safeCallback) {
      router.push(safeCallback);
      router.refresh();
      return;
    }
    // Không có callbackUrl: đưa admin/staff về /admin, còn lại về trang chủ.
    try {
      const res = await fetch("/api/auth/session");
      const session = (await res.json()) as {
        user?: { role?: string };
      };
      const role = session?.user?.role;
      router.push(
        role === "admin" || role === "editor" || role === "author"
          ? "/admin"
          : "/"
      );
    } catch {
      router.push("/");
    }
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-blue-500/5 dark:shadow-black/40 p-8"
    >
      <div className="mb-6">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Email
        </label>
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={mfaRequired}
            autoComplete="email"
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60"
            placeholder="bao@email.com"
          />
        </div>
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            disabled={mfaRequired}
            autoComplete="current-password"
            className="w-full pl-11 pr-12 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-60"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            disabled={mfaRequired}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-60"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mfaRequired && (
        <div className="mb-6">
          <label
            htmlFor="totp"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Mã xác thực (TOTP)
          </label>
          <input
            id="totp"
            name="totp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="[0-9]{6}"
            required
            autoFocus
            placeholder="6 số từ app xác thực"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors tracking-[0.3em] text-center"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Nhập mã 6 số từ ứng dụng xác thực (Google Authenticator, Authy...)
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="group relative w-full py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold rounded-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-600/25 dark:shadow-blue-600/40 flex items-center justify-center gap-2 overflow-hidden"
      >
        {loading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )}
        {loading
          ? "Đang kiểm tra..."
          : mfaRequired
            ? "Xác thực"
            : "Đăng nhập"}
      </button>

      {mfaRequired && (
        <button
          type="button"
          onClick={() => setMfaRequired(false)}
          className="mt-3 w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          ← Quay lại
        </button>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex-1 overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50/40 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 pt-12 pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-[80px]" />
      </div>

      <div className="relative w-full max-w-md mx-auto pt-6">
        <div className="text-center mb-8">
          <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg shadow-blue-500/10 text-2xl font-bold text-blue-600 dark:text-blue-400">
            {"</>"}
          </span>
          <h1 className="mt-5 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Đăng nhập
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Chào mừng bạn quay lại! Vui lòng đăng nhập để tiếp tục.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-2xl text-center text-gray-400">
              <svg className="w-6 h-6 mx-auto animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="mt-3">Đang tải...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Chưa có tài khoản? Vui lòng liên hệ quản trị viên để được tạo tài
          khoản.
        </p>
      </div>
    </div>
  );
}