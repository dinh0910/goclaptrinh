import { sqliteClient } from "./db";

interface RateLimitRow {
  window_start: number;
  count: number;
}

export interface RateLimiter {
  windowMs: number;
  max: number;
  allow(key: string): boolean;
}

function makeLimiter(table: string, windowMs: number, max: number): RateLimiter {
  const selectStmt = sqliteClient.prepare(
    `SELECT window_start, count FROM ${table} WHERE key = ?`
  );
  const upsertStmt = sqliteClient.prepare(
    `INSERT INTO ${table} (key, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT(key) DO UPDATE SET window_start = excluded.window_start, count = 1`
  );
  const incrementStmt = sqliteClient.prepare(
    `UPDATE ${table} SET count = count + 1 WHERE key = ?`
  );

  return {
    windowMs,
    max,
    allow(key: string): boolean {
      if (!key) key = "anon";
      const now = Date.now();
      const row = selectStmt.get(key) as RateLimitRow | undefined;

      if (!row || now - row.window_start >= windowMs) {
        upsertStmt.run(key, now);
        return true;
      }
      if (row.count >= max) {
        return false;
      }
      incrementStmt.run(key);
      return true;
    },
  };
}

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

export const welcomeLimiter = makeLimiter("welcome_rate_limits", WINDOW_MS, MAX_PER_WINDOW);

// Backwards-compatible wrapper for the welcome submit endpoint.
export function allowSubmit(key: string): boolean {
  return welcomeLimiter.allow(key);
}

// 10 attempts per 15 minutes, keyed by normalized email + IP.
export const loginLimiter = makeLimiter("login_rate_limits", 15 * 60_000, 10);