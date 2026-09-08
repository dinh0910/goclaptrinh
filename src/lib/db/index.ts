import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { CATEGORIES } from "@/lib/constants";
import * as schema from "./schema";

const dbPath = path.join(process.cwd(), "data", "blog.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const categoriesTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'categories'"
  )
  .get();

if (!categoriesTable) {
  sqlite.exec(`
    CREATE TABLE categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT ''
    );
  `);
  const insert = sqlite.prepare(
    "INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)"
  );
  for (const cat of CATEGORIES) {
    insert.run(cat.slug, cat.name, cat.description);
  }
}

const mediaTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'media'"
  )
  .get();

if (!mediaTable) {
  sqlite.exec(`
    CREATE TABLE media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      url TEXT NOT NULL,
      original_name TEXT NOT NULL DEFAULT '',
      mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
      size INTEGER NOT NULL DEFAULT 0,
      width INTEGER NOT NULL DEFAULT 0,
      height INTEGER NOT NULL DEFAULT 0,
      original_width INTEGER NOT NULL DEFAULT 0,
      original_height INTEGER NOT NULL DEFAULT 0,
      title TEXT NOT NULL DEFAULT '',
      alt_text TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: add original_width/original_height to existing DBs.
for (const col of ["original_width", "original_height"]) {
  const hasCol = sqlite
    .prepare(
      `SELECT name FROM pragma_table_info('media') WHERE name = ?`
    )
    .get(col);
  if (!hasCol) {
    sqlite.exec(
      `ALTER TABLE media ADD COLUMN ${col} INTEGER NOT NULL DEFAULT 0;`
    );
  }
}

// Backfill original dimensions for existing rows that don't have them yet,
// falling back to the current dimensions so "restore" works for older media.
sqlite
  .prepare(
    `UPDATE media SET original_width = width, original_height = height
     WHERE original_width = 0 OR original_height = 0`
  )
  .run();

// Boot-time migration: add icon to existing categories DBs.
const hasIconCol = sqlite
  .prepare(`SELECT name FROM pragma_table_info('categories') WHERE name = ?`)
  .get("icon");
if (!hasIconCol) {
  sqlite.exec(`ALTER TABLE categories ADD COLUMN icon TEXT NOT NULL DEFAULT '';`);
}

// Backfill default icons for categories that don't have one yet.
const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  javascript: "⚡",
  typescript: "🔷",
  react: "⚛️",
  nextjs: "▲",
  nodejs: "🟢",
  python: "🐍",
  devops: "🔧",
  "co-ban": "📚",
};
const backfillIcons = sqlite.prepare(
  `UPDATE categories SET icon = ? WHERE slug = ? AND (icon IS NULL OR icon = '')`
);
for (const [slug, icon] of Object.entries(DEFAULT_CATEGORY_ICONS)) {
  backfillIcons.run(icon, slug);
}
sqlite
  .prepare(
    `UPDATE categories SET icon = '📁' WHERE icon IS NULL OR icon = ''`
  )
  .run();

// Boot-time migration: add color to existing categories DBs.
const hasColorCol = sqlite
  .prepare(`SELECT name FROM pragma_table_info('categories') WHERE name = ?`)
  .get("color");
if (!hasColorCol) {
  sqlite.exec(`ALTER TABLE categories ADD COLUMN color TEXT NOT NULL DEFAULT '';`);
}

// Backfill default colors for categories that don't have one yet.
const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  javascript: "yellow",
  typescript: "blue",
  react: "cyan",
  nextjs: "gray",
  nodejs: "green",
  python: "sky",
  devops: "purple",
  "co-ban": "emerald",
};
const backfillColors = sqlite.prepare(
  `UPDATE categories SET color = ? WHERE slug = ? AND (color IS NULL OR color = '')`
);
for (const [slug, color] of Object.entries(DEFAULT_CATEGORY_COLORS)) {
  backfillColors.run(color, slug);
}
sqlite
  .prepare(
    `UPDATE categories SET color = 'gray' WHERE color IS NULL OR color = ''`
  )
  .run();

// Boot-time migration: create roles table for user/role management.
const rolesTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'roles'"
  )
  .get();

if (!rolesTable) {
  sqlite.exec(`
    CREATE TABLE roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      permissions TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `);
  const insertRole = sqlite.prepare(
    "INSERT OR IGNORE INTO roles (slug, name, description, permissions, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  const now = new Date().toISOString();
  const defaultRoles: [string, string, string, string[]][] = [
    ["admin", "Quản trị viên", "Toàn quyền trên toàn hệ thống", ["all"]],
    ["editor", "Biên tập viên", "Quản lý bài viết, danh mục, media", ["posts", "categories", "media"]],
    ["author", "Tác giả", "Chỉ viết và chỉnh sửa bài viết", ["posts"]],
    ["viewer", "Xem", "Chỉ xem nội dung admin", []],
  ];
  for (const [slug, name, description, permissions] of defaultRoles) {
    insertRole.run(slug, name, description, JSON.stringify(permissions), now);
  }
}

export const db = drizzle(sqlite, { schema });
