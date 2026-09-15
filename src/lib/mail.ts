import { sqliteClient } from "./db";

export interface MailConfig {
  provider: "resend" | "sendgrid";
  apiKey: string;
  from: string;
  fromName?: string;
}

export const MAIL_CONFIG_KEYS = {
  provider: "mail_provider",
  apiKey: "mail_api_key",
  from: "mail_from",
  fromName: "mail_from_name",
} as const;

export const MAIL_DEFAULTS: MailConfig = {
  provider: "resend",
  apiKey: "",
  from: "",
  fromName: "",
};

export function getMailConfig(): MailConfig {
  const get = (key: string): string | null => {
    const row = sqliteClient
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get(key) as { value: string } | undefined;
    return row?.value ?? null;
  };
  const provider = get(MAIL_CONFIG_KEYS.provider);
  return {
    provider: provider === "sendgrid" ? "sendgrid" : "resend",
    apiKey: get(MAIL_CONFIG_KEYS.apiKey) || "",
    from: get(MAIL_CONFIG_KEYS.from) || "",
    fromName: get(MAIL_CONFIG_KEYS.fromName) || "",
  };
}

export function saveMailConfig(cfg: {
  provider?: string;
  apiKey?: string;
  from?: string;
  fromName?: string;
}) {
  const set = (key: string, value: string) => {
    sqliteClient
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      )
      .run(key, value);
  };
  if (cfg.provider === "resend" || cfg.provider === "sendgrid") {
    set(MAIL_CONFIG_KEYS.provider, cfg.provider);
  }
  if (typeof cfg.apiKey === "string" && cfg.apiKey.trim()) {
    set(MAIL_CONFIG_KEYS.apiKey, cfg.apiKey.trim());
  }
  if (typeof cfg.from === "string" && cfg.from.trim()) {
    set(MAIL_CONFIG_KEYS.from, cfg.from.trim());
  }
  if (typeof cfg.fromName === "string") {
    set(MAIL_CONFIG_KEYS.fromName, cfg.fromName.trim());
  }
}

export interface EmailMessage {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export type SendResult =
  | { ok: true }
  | { ok: false; error: string };

async function sendResend(apiKey: string, from: string, msg: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [msg.to],
      subject: msg.subject,
      html: msg.html || "",
      text: msg.text || "",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}

async function sendSendGrid(apiKey: string, from: string, fromName: string | undefined, msg: EmailMessage): Promise<SendResult> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: msg.to }], subject: msg.subject }],
      from: { email: from, name: fromName || undefined },
      content: [
        { type: "text/html", value: msg.html || msg.text || "" },
        ...(msg.html ? [{ type: "text/plain", value: msg.text || "" }] : []),
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `SendGrid ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}

function isConfigured(cfg: MailConfig): string | null {
  if (!cfg.apiKey) return "Chưa cấu hình API key";
  if (!cfg.from) return "Chưa cấu hình địa chỉ email gửi (From)";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.from)) return "Email gửi (From) không hợp lệ";
  return null;
}

export async function sendEmail(
  msg: EmailMessage,
  cfgOverride?: Partial<MailConfig>
): Promise<SendResult> {
  const cfg = { ...getMailConfig(), ...cfgOverride };
  const missing = isConfigured(cfg);
  if (missing) return { ok: false, error: missing };
  const from = cfg.fromName ? `${cfg.fromName} <${cfg.from}>` : cfg.from;
  try {
    if (cfg.provider === "sendgrid") {
      return await sendSendGrid(cfg.apiKey, cfg.from, cfg.fromName, msg);
    }
    return await sendResend(cfg.apiKey, from, msg);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lỗi gửi email" };
  }
}