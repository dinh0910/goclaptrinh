export const DEFAULT_BAR_COLOR = "#0f172a";

/** Chuẩn hóa hex (#rgb -> #rrggbb, viết hoa). Trả "" nếu không hợp lệ. */
export function normalizeHexColor(value: string): string {
  const m = value.trim().match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return "";
  const raw = m[1];
  const full =
    raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  return `#${full.toUpperCase()}`;
}

/** Kiểm tra màu đã chuẩn dạng #rrggbb chưa. */
export function isValidBarColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Chọn màu chữ cho vừa tương phản với nền: nền sáng -> chữ tối, nền tối -> chữ sáng.
 */
export function getBarTextColor(backgroundColor: string): string {
  const h = backgroundColor.replace("#", "");
  const full =
    h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.4 ? "#111827" : "#f9fafb";
}