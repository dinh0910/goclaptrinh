import { sqliteClient } from "./db";

export interface NewsletterSubscriber {
  id: number;
  email: string;
  name: string;
  source: string;
  token: string;
  unsubscribed: boolean;
  createdAt: string;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim().toLowerCase());
}

export function hasUnsubscribeToken(token: string): boolean {
  if (!token) return false;
  return !!sqliteClient
    .prepare("SELECT 1 AS one FROM newsletter_subscribers WHERE token = ?")
    .get(token);
}

export function getSubscriberByEmail(email: string): NewsletterSubscriber | null {
  const row = sqliteClient
    .prepare("SELECT * FROM newsletter_subscribers WHERE email = ?")
    .get(email.trim().toLowerCase()) as
    | (Omit<NewsletterSubscriber, "unsubscribed"> & { unsubscribed: number })
    | undefined;
  return row ? { ...row, unsubscribed: !!row.unsubscribed } : null;
}

export function getSubscriberByToken(token: string): NewsletterSubscriber | null {
  const row = sqliteClient
    .prepare("SELECT * FROM newsletter_subscribers WHERE token = ?")
    .get(token) as
    | (Omit<NewsletterSubscriber, "unsubscribed"> & { unsubscribed: number })
    | undefined;
  return row ? { ...row, unsubscribed: !!row.unsubscribed } : null;
}

export function addSubscriber(input: {
  email: string;
  name?: string;
  source: "welcome" | "form" | "manual";
}): { ok: boolean; exists?: boolean; error?: string; subscriber?: NewsletterSubscriber } {
  const email = input.email.trim().toLowerCase();
  if (!isValidEmail(email)) {
    return { ok: false, error: "Email không hợp lệ" };
  }
  const existing = getSubscriberByEmail(email);
  if (existing) {
    if (existing.unsubscribed) {
      sqliteClient
        .prepare("UPDATE newsletter_subscribers SET unsubscribed = 0 WHERE email = ?")
        .run(email);
      return { ok: true, exists: true, subscriber: { ...existing, unsubscribed: false } };
    }
    return { ok: true, exists: true, subscriber: existing };
  }
  const token = Buffer.from(`${Date.now()}.${email}.${Math.random().toString(36).slice(2)}`)
    .toString("base64url");
  const result = sqliteClient
    .prepare(
      `INSERT OR IGNORE INTO newsletter_subscribers (email, name, source, token, unsubscribed, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`
    )
    .run(email, (input.name ?? "").trim(), input.source, token, new Date().toISOString());
  if (result.changes === 0) return { ok: true, exists: true };
  const subscriber = getSubscriberByEmail(email)!;
  return { ok: true, subscriber };
}

export function unsubscribeByToken(token: string): boolean {
  const sub = getSubscriberByToken(token);
  if (!sub || sub.unsubscribed) return !!sub;
  sqliteClient
    .prepare("UPDATE newsletter_subscribers SET unsubscribed = 1 WHERE id = ?")
    .run(sub.id);
  return true;
}

export function removeSubscriber(id: number): boolean {
  const result = sqliteClient
    .prepare("DELETE FROM newsletter_subscribers WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export function listSubscribers(opts?: {
  includeUnsubscribed?: boolean;
}): NewsletterSubscriber[] {
  const query = opts?.includeUnsubscribed
    ? "SELECT * FROM newsletter_subscribers ORDER BY id DESC"
    : "SELECT * FROM newsletter_subscribers WHERE unsubscribed = 0 ORDER BY id DESC";
  const rows = sqliteClient.prepare(query).all() as Array<
    Omit<NewsletterSubscriber, "unsubscribed"> & { unsubscribed: number }
  >;
  return rows.map((r) => ({ ...r, unsubscribed: !!r.unsubscribed }));
}

export function getNewsletterCounts() {
  const active = sqliteClient
    .prepare("SELECT count(*) AS c FROM newsletter_subscribers WHERE unsubscribed = 0")
    .get() as { c: number };
  const total = sqliteClient
    .prepare("SELECT count(*) AS c FROM newsletter_subscribers")
    .get() as { c: number };
  return { active: Number(active.c), total: Number(total.c) };
}

/** Pull any email-looking field value from welcome submissions into the list. */
export function syncFromWelcome(): number {
  const rows = sqliteClient.prepare("SELECT data FROM welcome_submissions").all() as Array<{
    data: string;
  }>;
  let added = 0;
  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      if (!data || typeof data !== "object") continue;
      for (const value of Object.values(data)) {
        const email = typeof value === "string" ? value.trim().toLowerCase() : "";
        if (email && isValidEmail(email)) {
          const res = addSubscriber({ email, source: "welcome" });
          if (res.ok && !res.exists) added += 1;
        }
      }
    } catch {
      /* skip malformed row */
    }
  }
  return added;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  provider: string;
  sentAt: string;
  total: number;
  ok: number;
  failed: number;
}

export function listCampaigns(limit = 20) {
  return getCampaigns().slice(0, limit);
}

export function saveCampaign(campaign: NewsletterCampaign) {
  const list = getCampaigns();
  list.unshift(campaign);
  sqliteClient
    .prepare(
      `INSERT INTO settings (key, value) VALUES ('newsletter_campaigns', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(JSON.stringify(list.slice(0, 100)));
}

function getCampaigns(): NewsletterCampaign[] {
  const row = sqliteClient
    .prepare("SELECT value FROM settings WHERE key = 'newsletter_campaigns'")
    .get() as { value?: string } | undefined;
  if (!row?.value) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? (parsed as NewsletterCampaign[]) : [];
  } catch {
    return [];
  }
}