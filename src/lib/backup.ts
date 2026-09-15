import fs from "fs";
import path from "path";

import { sqliteClient, rebuildSearchIndex } from "./db";

const BACKUP_FILENAME_RE = /^blog-\d{4}-\d{2}-\d{2}-\d{6}\.db$/;

export const BACKUP_LAST_KEY = "backup_last";
export const BACKUP_INTERVAL_KEY = "backup_interval_hrs";

export interface BackupMeta {
  filename: string;
  size: number;
  createdAt: number;
}

function backupDir(): string {
  const dir = path.join(process.cwd(), "data", "backups");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getSetting(key: string): string | null {
  const row = sqliteClient
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

function setSetting(key: string, value: string) {
  sqliteClient
    .prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value);
}

function sq(s: string): string {
  return `'${s.replace(/'/g, "''")}'`;
}

export function listBackups(): BackupMeta[] {
  const dir = backupDir();
  const files = fs.readdirSync(dir).filter((f) => BACKUP_FILENAME_RE.test(f));
  return files
    .map((filename) => {
      const stat = fs.statSync(path.join(dir, filename));
      return { filename, size: stat.size, createdAt: stat.mtimeMs };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function createBackup(): BackupMeta {
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const filename =
    `blog-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.db`;
  const dest = path.join(dir, filename);

  sqliteClient.exec(`VACUUM INTO ${sq(dest)}`);

  const stat = fs.statSync(dest);
  return { filename, size: stat.size, createdAt: stat.mtimeMs };
}

export function deleteBackup(filename: string): boolean {
  if (!BACKUP_FILENAME_RE.test(filename)) return false;
  const file = path.join(backupDir(), filename);
  if (!fs.existsSync(file)) return false;
  fs.unlinkSync(file);
  return true;
}

const RESTORE_SKIP = new Set(["posts_fts"]);

function isShadowTable(name: string, virtualTables: string[]): boolean {
  if (RESTORE_SKIP.has(name)) return true;
  return virtualTables.some((vt) => name.startsWith(vt + "_"));
}

/** Restore the current database from a backup file, then rebuild the FTS index.
 *  Returns the list of tables that were restored. Never closes the connection. */
export function restoreBackup(filename: string): { restored: string[] } {
  if (!BACKUP_FILENAME_RE.test(filename)) {
    throw new Error("Tên file backup không hợp lệ");
  }
  const source = path.join(backupDir(), filename);
  if (!fs.existsSync(source)) {
    throw new Error("Không tìm thấy file backup");
  }

  sqliteClient.prepare("ATTACH DATABASE ? AS bak").run(source);

  try {
    const virtualTables = (
      sqliteClient
        .prepare(
          `SELECT name FROM bak.sqlite_master
           WHERE type = 'table' AND sql LIKE 'CREATE VIRTUAL TABLE%'`
        )
        .all() as { name: string }[]
    ).map((r) => r.name);

    const tables = (
      sqliteClient
        .prepare(
          `SELECT name FROM bak.sqlite_master
           WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
           ORDER BY name`
        )
        .all() as { name: string }[]
    )
      .map((r) => r.name)
      .filter((name) => !isShadowTable(name, virtualTables));

    const restoreTx = sqliteClient.transaction(() => {
      for (const table of tables) {
        const cols = (
          sqliteClient
            .prepare(`PRAGMA table_info(${sq(table)})`)
            .all() as { name: string }[]
        ).map((c) => c.name);

        if (!cols.length) continue;
        const quoted = cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(", ");
        sqliteClient.exec(`DELETE FROM "${table.replace(/"/g, '""')}"`);
        sqliteClient.exec(
          `INSERT INTO "${table.replace(/"/g, '""')}" (${quoted}) SELECT ${quoted} FROM bak."${table.replace(/"/g, '""')}"`
        );
      }
      return tables;
    });

    const restored = restoreTx();
    sqliteClient.exec("DETACH DATABASE bak");
    rebuildSearchIndex();
    return { restored };
  } catch (err) {
    try {
      sqliteClient.exec("DETACH DATABASE bak");
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export function getBackupIntervalHours(): number {
  const raw = getSetting(BACKUP_INTERVAL_KEY);
  const value = Number(raw ?? "24");
  return Number.isFinite(value) && value >= 0 ? value : 24;
}

export function setBackupIntervalHours(hours: number) {
  const v = Math.max(0, Math.min(Number.isFinite(hours) ? hours : 24, 24 * 365));
  setSetting(BACKUP_INTERVAL_KEY, String(v));
}

/** Create a backup if the configured interval has elapsed since the last one. */
export function maybeAutoBackup(): boolean {
  try {
    const intervalHrs = getBackupIntervalHours();
    if (intervalHrs <= 0) return false;

    const lastRaw = getSetting(BACKUP_LAST_KEY);
    const last = lastRaw ? Number(lastRaw) : 0;
    if (last && Date.now() - last < intervalHrs * 3_600_000) return false;

    createBackup();
    setSetting(BACKUP_LAST_KEY, String(Date.now()));
    return true;
  } catch (err) {
    console.error("Auto backup failed", err);
    return false;
  }
}