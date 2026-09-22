"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { SiteInfo } from "@/lib/site-info";
import {
  DEFAULT_BAR_COLOR,
  getBarTextColor,
  isValidBarColor,
  normalizeHexColor,
} from "@/lib/bar-colors";
import FieldError, { errorInputClass } from "@/components/shared/FieldError";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";
import {
  fieldErrorsFrom,
  isValidEmail,
  type FieldErrors,
} from "@/lib/validation";

const inputClass =
  "w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

const EMPTY: SiteInfo = {
  email: "",
  phone: "",
  announcement: "",
  announcementUrl: "",
  barColor: DEFAULT_BAR_COLOR,
};

const BAR_COLOR_PRESETS: { name: string; value: string }[] = [
  { name: "Xám đá", value: "#0F172A" },
  { name: "Đen than", value: "#111827" },
  { name: "Xám ấm", value: "#374151" },
  { name: "Xanh ngọc", value: "#0E7490" },
  { name: "Xanh dương", value: "#1D4ED8" },
  { name: "Tím than", value: "#4C1D95" },
  { name: "Nâu ấm", value: "#44403C" },
  { name: "Đỏ gạch", value: "#9F1239" },
];

function PreviewBar({ info }: { info: SiteInfo }) {
  const bg = isValidBarColor(info.barColor) ? info.barColor : DEFAULT_BAR_COLOR;
  const fg = getBarTextColor(bg);
  const accent = fg === "#f9fafb" ? "#fbbf24" : "#b45309";
  const hasAnnouncement = Boolean(info.announcement);
  const hasPhone = Boolean(info.phone);
  const hasEmail = Boolean(info.email);
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        Xem trước thanh thông tin
      </p>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div
          className="h-8 px-3 flex items-center justify-between gap-3 text-xs"
          style={{ backgroundColor: bg, color: fg }}
        >
          {hasAnnouncement ? (
            <span className="truncate">
              <span className="font-semibold" style={{ color: accent }}>
                ✦
              </span>{" "}
              {info.announcement}
            </span>
          ) : (
            <span className="flex items-center gap-4 min-w-0">
              {hasEmail && (
                <span className="flex items-center gap-1.5 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7l-9 6-9-6m0 0a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2z" />
                  </svg>
                  <span className="truncate">{info.email}</span>
                </span>
              )}
              {hasPhone && (
                <span className="flex items-center gap-1.5 shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.586a1 1 0 01.928.641l1.414 3.535a1 1 0 01-.277 1.106l-1.772 1.328a11.984 11.984 0 005.108 5.108l1.328-1.772a1 1 0 011.106-.277l3.535 1.414a1 1 0 01.641.928V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="truncate">{info.phone}</span>
                </span>
              )}
              {!hasEmail && !hasPhone && (
                <span className="truncate">Thông tin liên hệ</span>
              )}
            </span>
          )}
          <span className="shrink-0 font-medium">Tiếng Việt</span>
        </div>
      </div>
    </div>
  );
}

export default function SiteInfoSettings() {
  const [draft, setDraft] = useState<SiteInfo>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/site-info")
      .then((res) =>
        res.ok
          ? (res.json() as Promise<SiteInfo>)
          : Promise.reject(new Error("Không thể tải thông tin"))
      )
      .then((data) =>
        setDraft({
          email: data.email || "",
          phone: data.phone || "",
          announcement: data.announcement || "",
          announcementUrl: data.announcementUrl || "",
          barColor: data.barColor || DEFAULT_BAR_COLOR,
        })
      )
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra")
      )
      .finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<SiteInfo>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  };

  const save = async () => {
    const nextErrors: FieldErrors = {};
    const email = draft.email.trim();
    const phone = draft.phone.trim();
    const announcement = draft.announcement.trim();
    const announcementUrl = draft.announcementUrl.trim();
    const barColor =
      normalizeHexColor(draft.barColor) || DEFAULT_BAR_COLOR;

    if (email && !isValidEmail(email)) {
      nextErrors.email = "Địa chỉ email không hợp lệ";
    }
    if (phone && !/^[0-9+\-().\s]+$/.test(phone)) {
      nextErrors.phone = "Số điện thoại không hợp lệ";
    }
    if (announcementUrl && !/^https?:\/\/.+/.test(announcementUrl)) {
      nextErrors.announcementUrl =
        "Đường dẫn liên kết phải bắt đầu bằng http:// hoặc https://";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, email, phone, announcement, announcementUrl, barColor }),
      });
      const data = (await res.json()) as { error?: string; field?: string };
      if (!res.ok) {
        const parsed = fieldErrorsFrom(data);
        if (Object.keys(parsed.errors).length > 0) setErrors(parsed.errors);
        throw new Error(parsed.message);
      }
      toast.success("Đã lưu thông tin");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen label="Đang tải cấu hình..." compact />;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>Dòng thông báo (tùy chọn)</label>
        <input
          type="text"
          value={draft.announcement}
          onChange={(e) => update({ announcement: e.target.value })}
          placeholder="VD: 🎉 Ưu đãi 50% khóa học Next.js đến hết tháng 10"
          className={inputClass}
          maxLength={300}
        />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Nhập để hiện dòng thông báo trên header (khuyến mãi, ra mắt...). Để
          trống để hiện email và số điện thoại.
        </p>
      </div>

      <div>
        <label className={labelClass}>Link của thông báo (tùy chọn)</label>
        <input
          type="url"
          value={draft.announcementUrl}
          onChange={(e) => update({ announcementUrl: e.target.value })}
          placeholder="https://goclaptrinh.io.vn/courses"
          className={`${inputClass} ${errorInputClass(errors, "announcementUrl")}`}
          maxLength={300}
        />
        <FieldError message={errors.announcementUrl} />
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Bấm vào dòng thông báo sẽ mở link này (tab mới). Để trống nếu chỉ
          muốn hiện text thông báo không có link.
        </p>
      </div>

      <div>
        <label className={labelClass}>Màu nền thanh thông báo</label>
        <div className="flex flex-wrap items-center gap-2">
          {BAR_COLOR_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update({ barColor: p.value })}
              title={p.name}
              className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                draft.barColor.toUpperCase() === p.value
                  ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              style={{ backgroundColor: p.value }}
              aria-label={p.name}
            />
          ))}
          <div className="flex items-center gap-2 ml-1">
            <input
              type="color"
              value={normalizeHexColor(draft.barColor) || "#0F172A"}
              onChange={(e) => update({ barColor: e.target.value.toUpperCase() })}
              className="h-8 w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
              title="Màu tùy chỉnh"
            />
            <input
              type="text"
              value={draft.barColor}
              onChange={(e) => update({ barColor: e.target.value })}
              placeholder="#0F172A"
              className="w-24 px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={7}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Chọn màu sẵn hoặc nhập mã hex tùy ý. Chữ tự đổi sáng/tối cho vừa
          tương phản.
        </p>
      </div>

      <PreviewBar info={draft} />

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Email liên hệ</label>
          <input
            type="email"
            value={draft.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="contact@goclaptrinh.io.vn"
            className={`${inputClass} ${errorInputClass(errors, "email")}`}
            maxLength={200}
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label className={labelClass}>Số điện thoại</label>
          <input
            type="tel"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="098 765 4321"
            className={`${inputClass} ${errorInputClass(errors, "phone")}`}
            maxLength={30}
          />
          <FieldError message={errors.phone} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Đang lưu..." : "Lưu thông tin"}
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ảnh hưởng ngay đến thanh thông tin trên header trang chủ.
        </p>
      </div>
    </div>
  );
}