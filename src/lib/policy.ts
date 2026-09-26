import { sqliteClient } from "./db";
import {
  DEFAULT_POLICIES,
  MAX_POLICY_CONTENT_LENGTH,
  MAX_POLICY_SLUG_LENGTH,
  MAX_POLICY_SUMMARY_LENGTH,
  MAX_POLICY_TITLE_LENGTH,
  MAX_POLICIES,
  isValidPolicySlug,
  type PolicyDoc,
} from "./policy-config";

export const POLICY_KEY = "policy_pages";

/**
 * Chuẩn hoá từng phần tử khi đọc từ DB. Dữ liệu có thể đã bị sửa tay ngoài
 * ứng dụng nên không được tin kiểu dữ liệu của JSON.
 */
function normalizePolicy(raw: unknown): PolicyDoc | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const p = raw as Record<string, unknown>;

  const slug = typeof p.slug === "string" ? p.slug.trim() : "";
  if (!isValidPolicySlug(slug)) return null;

  return {
    slug: slug.slice(0, MAX_POLICY_SLUG_LENGTH),
    title: (typeof p.title === "string" ? p.title : "").slice(0, MAX_POLICY_TITLE_LENGTH),
    summary: (typeof p.summary === "string" ? p.summary : "").slice(0, MAX_POLICY_SUMMARY_LENGTH),
    content: (typeof p.content === "string" ? p.content : "").slice(0, MAX_POLICY_CONTENT_LENGTH),
    published: p.published === true,
    updatedAt: typeof p.updatedAt === "string" ? p.updatedAt : "",
  };
}

function readRaw(): unknown {
  const row = sqliteClient
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(POLICY_KEY) as { value: string } | undefined;
  if (!row?.value) return null;
  try {
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

/** Toàn bộ văn bản, kể cả bản nháp — dành cho màn hình quản trị. */
export function getPolicies(): PolicyDoc[] {
  const raw = readRaw();
  if (raw === null) return DEFAULT_POLICIES;
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const list: PolicyDoc[] = [];
  for (const item of raw.slice(0, MAX_POLICIES)) {
    const policy = normalizePolicy(item);
    // Bỏ slug trùng thay vì ném lỗi: dữ liệu hỏng không được làm sập trang.
    if (!policy || seen.has(policy.slug)) continue;
    seen.add(policy.slug);
    list.push(policy);
  }
  return list;
}

/** Chỉ văn bản đã xuất bản — dành cho trang public. */
export function getPublishedPolicies(): PolicyDoc[] {
  return getPolicies().filter((p) => p.published);
}

export function getPolicyBySlug(slug: string, options: { publishedOnly?: boolean } = {}): PolicyDoc | undefined {
  const list = options.publishedOnly ? getPublishedPolicies() : getPolicies();
  return list.find((p) => p.slug === slug);
}

export function savePolicies(policies: PolicyDoc[]) {
  sqliteClient
    .prepare(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(POLICY_KEY, JSON.stringify(policies.slice(0, MAX_POLICIES)));
}
