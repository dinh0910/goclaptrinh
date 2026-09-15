import { sqliteClient } from "./db";

export interface ProviderInput {
  baseUrl: string;
  apiKey: string;
  model?: string;
}

export interface AiProviderRow {
  id: number;
  name: string;
  base_url: string;
  api_key: string;
  model: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

export interface PublicProvider {
  id: number;
  name: string;
  baseUrl: string;
  model: string;
  hasKey: boolean;
  maskedKey: string;
  enabled: boolean;
}

export interface AiProfile {
  action: string;
  label: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enabled: boolean;
  updatedAt: string;
}

export function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export function emptyProvider(): PublicProvider {
  return {
    id: 0,
    name: "",
    baseUrl: "",
    model: "",
    hasKey: false,
    maskedKey: "",
    enabled: false,
  };
}

export function toPublicProvider(p: AiProviderRow): PublicProvider {
  return {
    id: p.id,
    name: p.name,
    baseUrl: p.base_url,
    model: p.model,
    hasKey: Boolean(p.api_key),
    maskedKey: maskApiKey(p.api_key),
    enabled: p.enabled === 1,
  };
}

export function listProviders(): AiProviderRow[] {
  return sqliteClient
    .prepare("SELECT * FROM ai_providers ORDER BY id ASC")
    .all() as AiProviderRow[];
}

export function getProviderById(id: number): AiProviderRow | null {
  const row = sqliteClient
    .prepare("SELECT * FROM ai_providers WHERE id = ?")
    .get(id) as AiProviderRow | undefined;
  return row ?? null;
}

export function getActiveProvider(): AiProviderRow | null {
  const row = sqliteClient
    .prepare("SELECT * FROM ai_providers WHERE enabled = 1 ORDER BY id ASC LIMIT 1")
    .get() as AiProviderRow | undefined;
  return row ?? null;
}

export function setActiveProvider(id: number) {
  const now = new Date().toISOString();
  sqliteClient.transaction(() => {
    sqliteClient
      .prepare("UPDATE ai_providers SET enabled = 0, updated_at = ?")
      .run(now);
    sqliteClient
      .prepare("UPDATE ai_providers SET enabled = 1, updated_at = ? WHERE id = ?")
      .run(now, id);
  })();
}

export function createProvider(input: {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  active: boolean;
}): number {
  const existingCount = (
    sqliteClient.prepare("SELECT count(*) AS c FROM ai_providers").get() as { c: number }
  ).c;
  const now = new Date().toISOString();
  if (input.active || existingCount === 0) {
    setActiveProvider(0);
  }
  const info = sqliteClient
    .prepare(
      `INSERT INTO ai_providers (name, base_url, api_key, model, enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      normalizeBaseUrl(input.baseUrl),
      input.apiKey,
      input.model,
      input.active || existingCount === 0 ? 1 : 0,
      now,
      now
    );
  const id = Number(info.lastInsertRowid);
  if (input.active || existingCount === 0) {
    setActiveProvider(id);
  }
  return id;
}

export function updateProvider(
  id: number,
  fields: {
    name?: string;
    baseUrl?: string;
    apiKey?: string | null;
    model?: string;
    active?: boolean;
  }
): AiProviderRow | null {
  const existing = getProviderById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  sqliteClient
    .prepare(
      `UPDATE ai_providers
       SET name = ?, base_url = ?, api_key = ?, model = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      fields.name?.trim() || existing.name,
      normalizeBaseUrl(fields.baseUrl ?? existing.base_url),
      fields.apiKey === null ? existing.api_key : fields.apiKey?.trim() || existing.api_key,
      fields.model?.trim() ?? existing.model,
      now,
      id
    );
  if (fields.active === true) {
    setActiveProvider(id);
  } else if (fields.active === false && existing.enabled === 1) {
    sqliteClient
      .prepare("UPDATE ai_providers SET enabled = 0, updated_at = ? WHERE id = ?")
      .run(now, id);
  }
  return getProviderById(id);
}

export function deleteProvider(id: number): void {
  sqliteClient.prepare("DELETE FROM ai_providers WHERE id = ?").run(id);
}

function mapProfile(row: {
  action: string;
  label: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  enabled: number;
  updated_at: string;
}): AiProfile {
  return {
    action: row.action,
    label: row.label,
    systemPrompt: row.system_prompt,
    temperature: row.temperature,
    maxTokens: row.max_tokens,
    enabled: row.enabled === 1,
    updatedAt: row.updated_at,
  };
}

export function listProfiles(): AiProfile[] {
  const rows = sqliteClient
    .prepare("SELECT * FROM ai_profiles ORDER BY id ASC")
    .all() as Array<{
    action: string;
    label: string;
    system_prompt: string;
    temperature: number;
    max_tokens: number;
    enabled: number;
    updated_at: string;
  }>;
  return rows.map(mapProfile);
}

export function getProfile(action: string): AiProfile | null {
  const row = sqliteClient
    .prepare("SELECT * FROM ai_profiles WHERE action = ?")
    .get(action) as
    | {
        action: string;
        label: string;
        system_prompt: string;
        temperature: number;
        max_tokens: number;
        enabled: number;
        updated_at: string;
      }
    | undefined;
  return row ? mapProfile(row) : null;
}

export function saveProfiles(
  items: Array<{
    action: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    enabled?: boolean;
  }>
): void {
  const now = new Date().toISOString();
  const stmt = sqliteClient.prepare(
    `UPDATE ai_profiles
     SET system_prompt = ?, temperature = ?, max_tokens = ?, enabled = ?, updated_at = ?
     WHERE action = ?`
  );
  sqliteClient.transaction(() => {
    for (const item of items) {
      const existing = getProfile(item.action);
      if (!existing) continue;
      stmt.run(
        item.systemPrompt ?? existing.systemPrompt,
        item.temperature ?? existing.temperature,
        item.maxTokens ?? existing.maxTokens,
        item.enabled === undefined ? (existing.enabled ? 1 : 0) : item.enabled ? 1 : 0,
        now,
        item.action
      );
    }
  })();
}

/**
 * Fetches the list of model ids from an OpenAI-compatible /models endpoint.
 */
export async function fetchLlmModels(cfg: {
  baseUrl: string;
  apiKey: string;
}): Promise<string[]> {
  if (!cfg.apiKey) {
    throw new Error("Chưa có API key để lấy danh sách model");
  }
  const base = normalizeBaseUrl(cfg.baseUrl);
  const endpoint = base.endsWith("/models") ? base : `${base}/models`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      /* ignore */
    }
    throw new Error(
      `Không thể lấy danh sách model (${res.status}): ${detail || res.statusText}`
    );
  }

  const data = await res.json();
  const ids = Array.isArray(data?.data)
    ? (data.data as Array<{ id?: unknown }>)
        .map((m) => (typeof m?.id === "string" ? m.id : ""))
        .filter(Boolean)
    : [];
  if (ids.length === 0) {
    throw new Error("Provider không trả về danh sách model. Vui lòng nhập model thủ công.");
  }
  return ids.sort((a, b) => a.localeCompare(b));
}

export async function callLlm(
  opts: {
    system: string;
    user: string;
    maxTokens?: number;
    temperature?: number;
  },
  provider: ProviderInput
): Promise<string> {
  const baseUrl = normalizeBaseUrl(provider.baseUrl);
  const apiKey = provider.apiKey;
  if (!apiKey) {
    throw new Error("Nhà cung cấp AI chưa có API key");
  }
  const model = provider.model?.trim() || "gpt-4o-mini";

  const endpoint = baseUrl.endsWith("/chat/completions")
    ? baseUrl
    : `${baseUrl}/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 1500,
    }),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.error?.message || JSON.stringify(j);
    } catch {
      /* ignore */
    }
    throw new Error(`AI phản hồi lỗi (${res.status}): ${detail || res.statusText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("AI trả về nội dung rỗng");
  }
  return text.trim();
}