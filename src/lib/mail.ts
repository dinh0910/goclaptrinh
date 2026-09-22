import net from "net";
import tls from "tls";
import { sqliteClient } from "./db";
import { isMailProvider, type MailProvider } from "./mailProviders";

export interface MailConfig {
  provider: MailProvider;
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
    provider: isMailProvider(provider) ? provider : "resend",
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
  if (isMailProvider(cfg.provider)) {
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

const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 587;
const SMTP_TIMEOUT_MS = 60000;

interface SmtpReply {
  code: number;
  message: string;
}

class SmtpClient {
  private socket: net.Socket;
  private buf = "";
  private lines: string[] = [];
  private waiters: Array<{
    resolve: (r: SmtpReply) => void;
    reject: (e: Error) => void;
  }> = [];
  private failed = false;

  private constructor(socket: net.Socket) {
    this.socket = socket;
    socket.setEncoding("utf-8");
    socket.setTimeout(SMTP_TIMEOUT_MS);
    socket.on("data", (chunk: string) => this.onData(chunk));
    socket.on("error", () => this.fail("SMTP connection error"));
    socket.on("close", () => this.fail("SMTP connection closed"));
    socket.on("timeout", () => {
      socket.destroy();
      this.fail("SMTP timeout");
    });
  }

  private fail(message: string) {
    if (this.failed) return;
    this.failed = true;
    this.socket.destroy();
    for (const w of this.waiters.splice(0)) w.reject(new Error(message));
  }

  private onData(chunk: string) {
    this.buf += chunk;
    let idx: number;
    while ((idx = this.buf.indexOf("\r\n")) !== -1) {
      const line = this.buf.slice(0, idx);
      this.buf = this.buf.slice(idx + 2);
      if (/^\d{3}[\s-]/.test(line)) this.lines.push(line);
      if (/^\d{3} /.test(line)) {
        const reply: SmtpReply = {
          code: Number(line.slice(0, 3)),
          message: this.lines
            .map((l) => l.replace(/^\d{3}[\s-]/, "").trim())
            .join(" ")
            .trim(),
        };
        this.lines = [];
        const w = this.waiters.shift();
        if (w) w.resolve(reply);
      }
    }
  }

  private readReply(): Promise<SmtpReply> {
    return new Promise((resolve, reject) => {
      if (this.failed) {
        reject(new Error("SMTP connection closed"));
        return;
      }
      this.waiters.push({ resolve, reject });
    });
  }

  async command(cmd: string): Promise<SmtpReply> {
    if (this.failed) throw new Error("SMTP connection closed");
    const reply = this.readReply();
    this.socket.write(`${cmd}\r\n`);
    return reply;
  }

  async sendData(payload: string): Promise<SmtpReply> {
    if (this.failed) throw new Error("SMTP connection closed");
    const dotStuffed = payload
      .split("\r\n")
      .map((l) => (l.startsWith(".") ? `.${l}` : l))
      .join("\r\n");
    const reply = this.readReply();
    this.socket.write(`${dotStuffed}\r\n.\r\n`);
    return reply;
  }

  async quit() {
    try {
      if (!this.failed) {
        const reply = this.readReply();
        this.socket.write("QUIT\r\n");
        await reply;
      }
    } catch {
      /* ignore */
    }
    this.socket.destroy();
  }

  async upgradeTls() {
    const upgraded = tls.connect({
      socket: this.socket,
      servername: GMAIL_SMTP_HOST,
    });
    await new Promise<void>((resolve, reject) => {
      upgraded.once("secureConnect", () => resolve());
      upgraded.once("error", reject);
    });
    upgraded.setEncoding("utf-8");
    upgraded.setTimeout(SMTP_TIMEOUT_MS);
    this.socket = upgraded;
    upgraded.on("data", (chunk: string) => this.onData(chunk));
    upgraded.on("error", () => this.fail("SMTP TLS error"));
    upgraded.on("close", () => this.fail("SMTP connection closed"));
    upgraded.on("timeout", () => {
      upgraded.destroy();
      this.fail("SMTP timeout");
    });
  }

  static open(): Promise<SmtpClient> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(GMAIL_SMTP_PORT, GMAIL_SMTP_HOST);
      const client = new SmtpClient(socket);
      socket.once("error", reject);
      socket.once("connect", async () => {
        socket.removeListener("error", reject);
        try {
          const greeting = await client.readReply();
          if (greeting.code !== 220) {
            throw new Error(`Không nhận được phản hồi từ Gmail (${greeting.code})`);
          }
          resolve(client);
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Lỗi kết nối Gmail"));
        }
      });
    });
  }
}

function smtpBase64(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64");
}

function buildSmtpPayload(
  user: string,
  fromName: string | undefined,
  msg: EmailMessage
): string {
  const from = fromName ? `"${fromName.replace(/"/g, '\\"')}" <${user}>` : `<${user}>`;
  const subject = msg.subject.replace(/[\r\n]+/g, " ");
  const type = msg.html ? "text/html" : "text/plain";
  const content = msg.html || msg.text || "";
  return [
    `From: ${from}`,
    `To: <${msg.to}>`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: ${type}; charset="utf-8"`,
    "Content-Transfer-Encoding: 8bit",
    "",
    content,
  ].join("\r\n");
}

async function sendGmail(
  user: string,
  appPassword: string,
  fromName: string | undefined,
  msg: EmailMessage
): Promise<SendResult> {
  const domain = (user.split("@")[1] || "gmail.com").trim() || "gmail.com";
  try {
    const client = await SmtpClient.open();
    try {
      let reply = await client.command(`EHLO ${domain}`);
      if (reply.code !== 250) throw new Error(`EHLO ${reply.code}: ${reply.message}`);

      reply = await client.command("STARTTLS");
      if (reply.code !== 220) throw new Error(`STARTTLS ${reply.code}: ${reply.message}`);
      await client.upgradeTls();

      reply = await client.command(`EHLO ${domain}`);
      if (reply.code !== 250) throw new Error(`EHLO ${reply.code}: ${reply.message}`);

      reply = await client.command("AUTH LOGIN");
      if (reply.code !== 334) throw new Error(`AUTH ${reply.code}: ${reply.message}`);
      reply = await client.command(smtpBase64(user));
      if (reply.code !== 334) throw new Error(`Xác thực tài khoản thất bại (${reply.code})`);
      reply = await client.command(smtpBase64(appPassword));
      if (reply.code !== 235) throw new Error(`Sai mật khẩu ứng dụng Gmail (${reply.code})`);

      reply = await client.command(`MAIL FROM:<${user}>`);
      if (reply.code !== 250) throw new Error(`MAIL FROM ${reply.code}: ${reply.message}`);

      const rcpt = msg.to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      for (const to of rcpt) {
        reply = await client.command(`RCPT TO:<${to}>`);
        if (reply.code !== 250) throw new Error(`RCPT TO ${reply.code}: ${reply.message}`);
      }

      reply = await client.command("DATA");
      if (reply.code !== 354) throw new Error(`DATA ${reply.code}: ${reply.message}`);

      const payload = buildSmtpPayload(user, fromName, msg);
      const sent = await client.sendData(payload);
      if (sent.code !== 250) throw new Error(`Gửi thất bại ${sent.code}: ${sent.message}`);
    } finally {
      await client.quit();
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Gmail SMTP: ${err instanceof Error ? err.message : "Lỗi gửi"}` };
  }
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
    if (cfg.provider === "google") {
      return await sendGmail(cfg.from, cfg.apiKey, cfg.fromName, msg);
    }
    return await sendResend(cfg.apiKey, from, msg);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Lỗi gửi email" };
  }
}