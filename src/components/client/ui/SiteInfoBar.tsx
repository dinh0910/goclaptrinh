"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SiteInfo } from "@/lib/site-info";
import {
  DEFAULT_BAR_COLOR,
  getBarTextColor,
  isValidBarColor,
} from "@/lib/bar-colors";

/**
 * Đoạn thông báo: nếu có announcementUrl thì toàn bộ dòng là link mở tab mới.
 */
function Announcement({
  text,
  url,
  accent,
}: {
  text: string;
  url?: string;
  accent: string;
}) {
  const inner = (
    <>
      <span className="font-semibold" style={{ color: accent }}>
        ✦
      </span>{" "}
      {text}
    </>
  );
  if (!url) return <p className="truncate">{inner}</p>;
  return (
    <Link
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="truncate underline underline-offset-2 hover:opacity-80"
      style={{ textDecorationColor: accent }}
      title={text}
    >
      {inner}
    </Link>
  );
}

/**
 * Dải thông tin nhỏ ở đầu header (chỉ hiện trên trang client).
 * - Có dòng thông báo (khuyến mãi/ra mắt): hiện announcement.
 * - Ngược lại: hiện email + số điện thoại liên hệ.
 * - Bên phải luôn hiện nhãn ngôn ngữ.
 * Không có dữ liệu nào -> ẩn toàn bộ dải thông tin.
 */
export default function SiteInfoBar({ info }: { info: SiteInfo }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const hasContact = Boolean(info.email || info.phone);

  if (!info.announcement && !hasContact) {
    return null;
  }

  const bg = isValidBarColor(info.barColor) ? info.barColor : DEFAULT_BAR_COLOR;
  const fg = getBarTextColor(bg);
  const accent = fg === "#f9fafb" ? "#fbbf24" : "#b45309";

  return (
    <div style={{ backgroundColor: bg, color: fg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between gap-3 text-xs">
        {info.announcement ? (
          <Announcement
            text={info.announcement}
            url={info.announcementUrl || undefined}
            accent={accent}
          />
        ) : (
          <div className="flex items-center gap-4 min-w-0">
            {info.email && (
              <Link
                href={`mailto:${info.email}`}
                className="flex items-center gap-1.5 shrink-0 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 7l-9 6-9-6m0 0a2 2 0 00-2 2v10a2 2 0 002 2h18a2 2 0 002-2V9a2 2 0 00-2-2z" />
                </svg>
                <span className="truncate">{info.email}</span>
              </Link>
            )}
            {info.phone && (
              <Link
                href={`tel:${info.phone}`}
                className="flex items-center gap-1.5 shrink-0 hover:underline"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.586a1 1 0 01.928.641l1.414 3.535a1 1 0 01-.277 1.106l-1.772 1.328a11.984 11.984 0 005.108 5.108l1.328-1.772a1 1 0 011.106-.277l3.535 1.414a1 1 0 01.641.928V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="truncate">{info.phone}</span>
              </Link>
            )}
          </div>
        )}
        <span className="flex items-center gap-1.5 shrink-0 font-medium">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Tiếng Việt
        </span>
      </div>
    </div>
  );
}