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
      title TEXT NOT NULL DEFAULT '',
      alt_text TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

export const db = drizzle(sqlite, { schema });
