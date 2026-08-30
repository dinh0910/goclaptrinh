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

export const db = drizzle(sqlite, { schema });
