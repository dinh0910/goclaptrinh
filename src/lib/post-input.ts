import { sanitizePostHtml } from "./sanitize";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

const LIMITS: Record<string, number> = {
  title: 200,
  description: 600,
  date: 40,
  category: 100,
  author: 100,
  image: 500,
  rawContent: 300_000,
  readingTime: 50,
};

const REQUIRED = ["slug", "title", "description", "date", "category", "content"];

export interface CleanedPost {
  value: Record<string, unknown>;
  error?: string;
}

/**
 * Whitelist + validate post fields coming from the API body.
 * `partial` = true -> only fields present in `body` are returned (for PUT).
 */
export function cleanPostFields(
  body: Record<string, unknown>,
  partial = false
): CleanedPost {
  const out: Record<string, unknown> = {};
  const err = (msg: string): CleanedPost => ({ value: out, error: msg });
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

  for (const k of REQUIRED) {
    if (!partial && !has(k)) return err(`Thiếu trường bắt buộc: ${k}`);
  }

  if (has("slug")) {
    const v = body.slug;
    if (typeof v !== "string" || !SLUG_RE.test(v.trim())) {
      return err("Slug không hợp lệ (chỉ chữ thường, số và dấu gạch ngang)");
    }
    out.slug = v.trim().toLowerCase();
  } else if (!partial) {
    return err("Thiếu slug");
  }

  for (const [k, max] of Object.entries(LIMITS)) {
    if (!has(k)) {
      if (!partial) out[k] = "";
      continue;
    }
    const raw = body[k];
    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      return err(`Trường ${k} không hợp lệ`);
    }
    const s = typeof raw === "string" ? raw.trim() : "";
    if (s.length > max) {
      return err(`Trường ${k} quá dài (tối đa ${max} ký tự)`);
    }
    out[k] = s;
  }

  if (has("content")) {
    if (typeof body.content !== "string") return err("Nội dung không hợp lệ");
    if (body.content.length > 200_000) {
      return err("Nội dung quá dài (tối đa 200.000 ký tự)");
    }
    out.content = sanitizePostHtml(body.content);
  } else if (!partial) {
    out.content = "";
  }

  if (has("rawContent")) {
    if (typeof body.rawContent !== "string") return err("rawContent không hợp lệ");
  }

  if (has("tags")) {
    if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
      return err("Tags không hợp lệ");
    }
    const tags = (body.tags as string[])
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length > 20 || tags.some((t) => t.length > 50)) {
      return err("Tags không hợp lệ (tối đa 20 tag, mỗi tag 50 ký tự)");
    }
    out.tags = tags;
  } else if (!partial) {
    out.tags = [];
  }

  if (has("featured")) {
    if (typeof body.featured !== "boolean") return err("featured không hợp lệ");
    out.featured = body.featured;
  } else if (!partial) {
    out.featured = false;
  }

  return { value: out };
}