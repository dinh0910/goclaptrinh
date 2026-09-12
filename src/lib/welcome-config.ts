export type WelcomeTemplate =
  | "gradient"
  | "minimal"
  | "promo"
  | "dark"
  | "form";

export const WELCOME_TEMPLATES: {
  key: WelcomeTemplate;
  label: string;
  desc: string;
}[] = [
  {
    key: "gradient",
    label: "Gradient",
    desc: "Nổi bật với dải màu phía trên, nút xanh dương",
  },
  {
    key: "minimal",
    label: "Tối giản",
    desc: "Nhẹ nhàng, gọn gàng, nút viền",
  },
  {
    key: "promo",
    label: "Khuyến mãi",
    desc: "Phong cách ưu đãi cam/đỏ bắt mắt",
  },
  {
    key: "dark",
    label: "Nền tối phát sáng",
    desc: "Kính tối sang trọng với ánh sáng",
  },
  {
    key: "form",
    label: "Đăng ký nhận tin",
    desc: "Có form nhập email/số điện thoại, tự thêm field theo ý muốn",
  },
];

export type WelcomeFieldType = "email" | "phone" | "text" | "number";

export const FIELD_TYPES: { key: WelcomeFieldType; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Số điện thoại" },
  { key: "text", label: "Văn bản" },
  { key: "number", label: "Số" },
];

export interface WelcomeField {
  id: string;
  label: string;
  type: WelcomeFieldType;
  placeholder: string;
  required: boolean;
}

export interface WelcomeItem {
  id: string;
  name: string;
  active: boolean;
  template: WelcomeTemplate;
  badge: string;
  title: string;
  content: string;
  emoji: string;
  buttonText: string;
  buttonLink: string;
  reappearHours: number;
  appearDelay: number;
  fields: WelcomeField[];
  successMessage: string;
}

export const DEFAULT_ITEM: Omit<WelcomeItem, "id" | "name" | "active"> = {
  template: "gradient",
  badge: "ƯU ĐÃI",
  title: "Chào mừng bạn đến với Góc Lập Trình",
  content:
    "Đăng ký nhận bản tin để không bỏ lỡ những bài viết mới về lập trình và CNTT.",
  emoji: "🎉",
  buttonText: "Khám phá ngay",
  buttonLink: "/blog",
  reappearHours: 24,
  appearDelay: 3,
  fields: [
    {
      id: "email",
      label: "Email",
      type: "email",
      placeholder: "you@example.com",
      required: true,
    },
  ],
  successMessage:
    "Đăng ký thành công! Cảm ơn bạn đã quan tâm đến Góc Lập Trình.",
};

const TEMPLATE_KEYS = WELCOME_TEMPLATES.map((t) => t.key);
const FIELD_TYPE_KEYS = FIELD_TYPES.map((t) => t.key);

const DEFAULT_FIELD_LABEL: Record<WelcomeFieldType, string> = {
  email: "Email",
  phone: "Số điện thoại",
  text: "Nội dung",
  number: "Số",
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
    name: "",
    active: false,
    template: "gradient",
    badge: "",
    title: "",
    content: "",
    emoji: "",
    buttonText: "",
    buttonLink: "",
    reappearHours: 0,
    appearDelay: DEFAULT_ITEM.appearDelay,
    fields: [],
    successMessage: "",
  };
}

function normalizeFields(raw: unknown): WelcomeField[] {
  if (!Array.isArray(raw)) return [];
  const out: WelcomeField[] = [];
  raw.forEach((entry, idx) => {
    if (!entry || typeof entry !== "object") return;
    const f = entry as Record<string, unknown>;
    const type: WelcomeFieldType =
      typeof f.type === "string" && (FIELD_TYPE_KEYS as string[]).includes(f.type)
        ? (f.type as WelcomeFieldType)
        : "text";
    out.push({
      id:
        typeof f.id === "string" && f.id
          ? f.id
          : `${type}-${idx}-${Date.now().toString(36)}`,
      label:
        typeof f.label === "string" && f.label.trim()
          ? f.label.trim()
          : DEFAULT_FIELD_LABEL[type],
      type,
      placeholder: typeof f.placeholder === "string" ? f.placeholder : "",
      required: Boolean(f.required),
    });
  });
  return out;
}

export function normalizeItem(raw: Record<string, unknown>): WelcomeItem {
  const template =
    typeof raw.template === "string" &&
    (TEMPLATE_KEYS as string[]).includes(raw.template)
      ? (raw.template as WelcomeTemplate)
      : DEFAULT_ITEM.template;
  return {
    id: typeof raw.id === "string" && raw.id ? raw.id : emptyWelcomeItem().id,
    name:
      typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Popup",
    active: Boolean(raw.active),
    template,
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
    appearDelay:
      typeof raw.appearDelay === "number" &&
      Number.isFinite(raw.appearDelay) &&
      raw.appearDelay >= 0
        ? Math.min(60, Math.floor(raw.appearDelay))
        : DEFAULT_ITEM.appearDelay,
    fields: normalizeFields(raw.fields),
    successMessage:
      typeof raw.successMessage === "string"
        ? raw.successMessage
        : DEFAULT_ITEM.successMessage,
  };
}