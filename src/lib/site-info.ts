import { sqliteClient } from "./db";
import { DEFAULT_BAR_COLOR } from "./bar-colors";

export interface SiteInfo {
  email: string;
  phone: string;
  announcement: string;
  announcementUrl: string;
  barColor: string;
}

export const SITE_INFO_KEY = "site_info";

export const SITE_INFO_DEFAULTS: SiteInfo = {
  email: "",
  phone: "",
  announcement: "",
  announcementUrl: "",
  barColor: DEFAULT_BAR_COLOR,
};

export function getSiteInfo(): SiteInfo {
  const row = sqliteClient
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(SITE_INFO_KEY) as { value: string } | undefined;
  if (!row?.value) return SITE_INFO_DEFAULTS;
  try {
    const parsed = JSON.parse(row.value) as Partial<SiteInfo>;
    return {
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      announcement:
        typeof parsed.announcement === "string" ? parsed.announcement : "",
      announcementUrl:
        typeof parsed.announcementUrl === "string" ? parsed.announcementUrl : "",
      barColor:
        typeof parsed.barColor === "string" && parsed.barColor
          ? parsed.barColor
          : DEFAULT_BAR_COLOR,
    };
  } catch {
    return SITE_INFO_DEFAULTS;
  }
}

export function saveSiteInfo(info: SiteInfo) {
  sqliteClient
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(SITE_INFO_KEY, JSON.stringify(info));
}