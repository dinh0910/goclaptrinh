export interface WelcomeItem {
  id: string;
  name: string;
  active: boolean;
  badge: string;
  title: string;
  content: string;
  emoji: string;
  buttonText: string;
  buttonLink: string;
  reappearHours: number;
}

export const DEFAULT_ITEM: Omit<WelcomeItem, "id" | "name" | "active"> = {
  badge: "ƯU ĐÃI",
  title: "Chào mừng bạn đến với Góc Lập Trình",
  content:
    "Đăng ký nhận bản tin để không bỏ lỡ những bài viết mới về lập trình và CNTT.",
  emoji: "🎉",
  buttonText: "Khám phá ngay",
  buttonLink: "/blog",
  reappearHours: 24,
};

export const WELCOME_EMOJIS = [
  "🎉",
  "🎁",
  "🔥",
  "💥",
  "⭐",
  "🎊",
  "✨",
  "🚀",
  "📣",
  "🏷️",
  "💡",
  "🎯",
];

export function emptyWelcomeItem(): WelcomeItem {
  return {
    id: `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: "Popup mới",
    active: false,
    ...DEFAULT_ITEM,
  };
}

export function normalizeItem(raw: Record<string, unknown>): WelcomeItem {
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : emptyWelcomeItem().id,
    name:
      typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Popup",
    active: Boolean(raw.active),
    badge: typeof raw.badge === "string" ? raw.badge : "",
    title: typeof raw.title === "string" ? raw.title : "",
    content: typeof raw.content === "string" ? raw.content : "",
    emoji:
      typeof raw.emoji === "string" && raw.emoji.trim()
        ? raw.emoji.trim().slice(0, 8)
        : DEFAULT_ITEM.emoji,
    buttonText: typeof raw.buttonText === "string" ? raw.buttonText : "",
    buttonLink: typeof raw.buttonLink === "string" ? raw.buttonLink : "",
    reappearHours:
      typeof raw.reappearHours === "number" &&
      Number.isFinite(raw.reappearHours) &&
      raw.reappearHours >= 0
        ? Math.min(8760, Math.floor(raw.reappearHours))
        : DEFAULT_ITEM.reappearHours,
  };
}