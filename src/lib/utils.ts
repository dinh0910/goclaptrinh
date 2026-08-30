import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export function formatDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMMM, yyyy", { locale: vi });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = new Intl.DateTimeFormat("vi", { month: "long", timeZone: "UTC" }).format(date);
    const hour = date.getUTCHours();
    const meridiem = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minute = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month}, ${date.getUTCFullYear()} lúc ${hour12}:${minute} ${meridiem}`;
  } catch {
    return dateString;
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
