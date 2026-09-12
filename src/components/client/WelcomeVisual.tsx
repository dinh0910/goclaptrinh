"use client";

import { useState } from "react";
import Link from "next/link";
import type {
  WelcomeFieldType,
  WelcomeItem,
  WelcomeTemplate,
} from "@/lib/welcome-config";

const FIELD_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;

function fieldValid(type: WelcomeFieldType, value: string): boolean {
  switch (type) {
    case "email":
      return FIELD_EMAIL_RE.test(value);
    case "phone":
      return FIELD_PHONE_RE.test(value);
    case "number":
      return /^\d+([.,]\d+)?$/.test(value);
    default:
      return true;
  }
}

interface CtaProps {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
  className?: string;
}

function Cta({ item, preview, onAction, className }: CtaProps) {
  if (!item.buttonText) return null;
  const isExternal = item.buttonLink.startsWith("http://") ||
    item.buttonLink.startsWith("https://");
  const validLink = item.buttonLink.startsWith("/") || isExternal;
  const cls =
    className ??
    "inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl transition-all duration-200 shadow-sm hover:from-blue-700 hover:to-blue-600";

  if (preview || !validLink) {
    return <span className={cls}>{item.buttonText}</span>;
  }
  return isExternal ? (
    <a
      href={item.buttonLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onAction}
      className={cls}
    >
      {item.buttonText}
    </a>
  ) : (
    <Link href={item.buttonLink} onClick={onAction} className={cls}>
      {item.buttonText}
    </Link>
  );
}

function Badge({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <span
      className={`inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full ${
        className ?? "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/20"
      }`}
    >
      {text}
    </span>
  );
}

function GradientDesign({
  item,
  preview,
  onAction,
}: {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
      <div className="px-8 pt-10 pb-8 text-center">
        {item.emoji && (
          <div className="text-5xl mb-3 leading-none">{item.emoji}</div>
        )}
        <div className="mb-4">
          <Badge text={item.badge} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {item.title || "Tiêu đề"}
        </h2>
        {item.content && (
          <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-line">
            {item.content}
          </p>
        )}
        <div className="mt-6">
          <Cta item={item} preview={preview} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

function MinimalDesign({
  item,
  preview,
  onAction,
}: {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-xl ring-1 ring-gray-200 dark:ring-white/10">
      <div className="px-8 pt-10 pb-8 text-center">
        {item.emoji && (
          <div className="text-3xl mb-4 leading-none opacity-70">{item.emoji}</div>
        )}
        {item.badge && (
          <span className="inline-block mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            {item.badge}
          </span>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {item.title || "Tiêu đề"}
        </h2>
        {item.content && (
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-line">
            {item.content}
          </p>
        )}
        <div className="mt-6">
          <Cta
            item={item}
            preview={preview}
            onAction={onAction}
            className="inline-flex w-full items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-white/15 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

function PromoDesign({
  item,
  preview,
  onAction,
}: {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-500/40 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-500/10 dark:via-gray-900 dark:to-orange-500/10 shadow-xl">
      <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-orange-400/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-red-400/15 blur-2xl" />
      <div className="relative px-8 pt-8 pb-8 text-left">
        {item.emoji && <div className="text-4xl mb-3 leading-none">{item.emoji}</div>}
        <Badge
          text={item.badge}
          className="mb-3 text-white bg-gradient-to-r from-red-500 to-orange-500"
        />
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
          {item.title || "Tiêu đề"}
        </h2>
        {item.content && (
          <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-line">
            {item.content}
          </p>
        )}
        <div className="mt-6">
          <Cta
            item={item}
            preview={preview}
            onAction={onAction}
            className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/25 hover:brightness-110 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}

function DarkDesign({
  item,
  preview,
  onAction,
}: {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-950 shadow-2xl ring-1 ring-white/10">
      <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-blue-600/30 blur-[60px]" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-violet-600/25 blur-[60px]" />
      <div className="relative px-8 pt-10 pb-8 text-center">
        {item.emoji && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-3xl ring-1 ring-white/20">
            {item.emoji}
          </div>
        )}
        <div className="mb-4">
          <Badge text={item.badge} className="text-slate-200 bg-white/10 border border-white/15" />
        </div>
        <h2 className="text-xl font-bold text-white">{item.title || "Tiêu đề"}</h2>
        {item.content && (
          <p className="mt-3 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
            {item.content}
          </p>
        )}
        <div className="mt-6">
          <Cta
            item={item}
            preview={preview}
            onAction={onAction}
            className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl shadow-lg shadow-blue-600/40 hover:brightness-110 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}

function FormDesign({
  item,
  preview,
}: {
  item: WelcomeItem;
  preview?: boolean;
  onAction?: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const validate = (): Record<string, string> => {
    const next: Record<string, string> = {};
    for (const f of item.fields) {
      const v = (values[f.id] ?? "").trim();
      if (f.required && !v) {
        next[f.id] = `Vui lòng nhập ${f.label}`;
        continue;
      }
      if (v && !fieldValid(f.type, v)) {
        next[f.id] =
          f.type === "email"
            ? "Email không hợp lệ"
            : f.type === "phone"
              ? "Số điện thoại không hợp lệ"
              : f.type === "number"
                ? "Giá trị phải là số"
                : "Giá trị không hợp lệ";
      }
    }
    return next;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (preview) return;
    const next = validate();
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/welcome/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, values }),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setServerError(data?.error || "Không thể gửi đăng ký");
        return;
      }
      setDone(true);
    } catch {
      setServerError("Đã có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 text-center">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
        <div className="px-8 pt-12 pb-10">
          <div className="text-5xl mb-3 leading-none">{item.emoji || "✅"}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {item.successMessage.trim() || "Đăng ký thành công!"}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cảm ơn bạn đã quan tâm đến Góc Lập Trình.
          </p>
        </div>
      </div>
    );
  }

  const label = item.buttonText.trim() || "Đăng ký ngay";

  return (
    <form
      onSubmit={submit}
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
      noValidate
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-violet-500" />
      <div className="px-8 pt-9 pb-8">
        <div className="text-center">
          {item.emoji && (
            <div className="text-4xl mb-2 leading-none">{item.emoji}</div>
          )}
          <div className="mb-3">
            <Badge text={item.badge} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {item.title || "Tiêu đề"}
          </h2>
          {item.content && (
            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 whitespace-pre-line">
              {item.content}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {item.fields.map((f) => {
            const inputType =
              f.type === "email"
                ? "email"
                : f.type === "phone"
                  ? "tel"
                  : f.type === "number"
                    ? "number"
                    : "text";
            return (
              <div key={f.id}>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type={inputType}
                  inputMode={f.type === "number" ? "decimal" : undefined}
                  placeholder={f.placeholder}
                  value={values[f.id] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [f.id]: e.target.value }))
                  }
                  className={`w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors ${
                    errors[f.id]
                      ? "border-red-400 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                />
                {errors[f.id] && (
                  <p className="mt-1 text-xs text-red-500">{errors[f.id]}</p>
                )}
              </div>
            );
          })}
          {serverError && (
            <p className="text-center text-xs text-red-500">{serverError}</p>
          )}
          {preview ? (
            <span className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-sm">
              {label}
            </span>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-sm hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 transition-colors"
            >
              {submitting ? "Đang gửi..." : label}
            </button>
          )}
          {preview && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Khách truy cập sẽ nhập thông tin và gửi đăng ký tại đây.
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

export function WelcomeVisual({
  item,
  template,
  preview,
  onAction,
}: {
  item: WelcomeItem;
  template?: WelcomeTemplate;
  preview?: boolean;
  onAction?: () => void;
}) {
  const t = template ?? item.template ?? "gradient";
  switch (t) {
    case "minimal":
      return <MinimalDesign item={item} preview={preview} onAction={onAction} />;
    case "promo":
      return <PromoDesign item={item} preview={preview} onAction={onAction} />;
    case "dark":
      return <DarkDesign item={item} preview={preview} onAction={onAction} />;
    case "form":
      return <FormDesign item={item} preview={preview} />;
    case "gradient":
    default:
      return <GradientDesign item={item} preview={preview} onAction={onAction} />;
  }
}