import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import path from "path";
import { randomBytes } from "crypto";
import { CATEGORIES } from "@/lib/constants";
import * as schema from "./schema";
import { maybeAutoBackup } from "../backup";
import { DEFAULT_AI_PROFILES } from "@/lib/ai-defaults";
import { slugify } from "@/lib/utils";

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

// Give the editor role the "banners" permission (existing DBs may not have it).
const editorRoleRow = sqlite
  .prepare("SELECT permissions FROM roles WHERE slug = 'editor'")
  .get() as { permissions: string } | undefined;
if (editorRoleRow) {
  const editorPerms = JSON.parse(editorRoleRow.permissions) as string[];
  for (const perm of ["banners", "welcome", "courses"]) {
    if (!editorPerms.includes(perm)) {
      editorPerms.push(perm);
    }
  }
  sqlite
    .prepare("UPDATE roles SET permissions = ? WHERE slug = 'editor'")
    .run(JSON.stringify(editorPerms));
}

// Boot-time migration: create a generic key/value settings table.
const settingsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'settings'")
  .get();

if (!settingsTable) {
  sqlite.exec(`
    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '{}'
    );
  `);
}

// Boot-time migration: create table for welcome popup submissions.
const welcomeSubmissionsTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'welcome_submissions'"
  )
  .get();

if (!welcomeSubmissionsTable) {
  sqlite.exec(`
    CREATE TABLE welcome_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id TEXT NOT NULL,
      data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: add anonymous-client tracking columns.
for (const [col, ddl] of [
  ["visitor_id", "TEXT NOT NULL DEFAULT ''"],
  ["signals", "TEXT NOT NULL DEFAULT '{}'"],
  ["fingerprint", "TEXT NOT NULL DEFAULT ''"],
  ["ip", "TEXT NOT NULL DEFAULT ''"],
]) {
  const hasCol = sqlite
    .prepare(
      `SELECT name FROM pragma_table_info('welcome_submissions') WHERE name = ?`
    )
    .get(col);
  if (!hasCol) {
    sqlite.exec(`ALTER TABLE welcome_submissions ADD COLUMN ${col} ${ddl};`);
  }
}

// Boot-time migration: create rate-limit table for the public submit endpoint.
const rateLimitTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'welcome_rate_limits'"
  )
  .get();

if (!rateLimitTable) {
  sqlite.exec(`
    CREATE TABLE welcome_rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL
    );
  `);
}

// Boot-time migration: create rate-limit table for the login endpoint.
const loginRateLimitTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'login_rate_limits'"
  )
  .get();

if (!loginRateLimitTable) {
  sqlite.exec(`
    CREATE TABLE login_rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL
    );
  `);
}

// Boot-time migration: add MFA (TOTP) columns to existing user DBs.
for (const [col, ddl] of [
  ["totp_secret", "TEXT NOT NULL DEFAULT ''"],
  ["totp_enabled", "INTEGER NOT NULL DEFAULT 0"],
]) {
  const hasCol = sqlite
    .prepare(`SELECT name FROM pragma_table_info('users') WHERE name = ?`)
    .get(col);
  if (!hasCol) {
    sqlite.exec(`ALTER TABLE users ADD COLUMN ${col} ${ddl};`);
  }
}

// Boot-time migration: create audit log table.
const auditLogsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'audit_logs'")
  .get();

if (!auditLogsTable) {
  sqlite.exec(`
    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_email TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      entity TEXT NOT NULL DEFAULT '',
      entity_id TEXT NOT NULL DEFAULT '',
      detail TEXT NOT NULL DEFAULT '{}',
      ip TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: create the newsletter subscribers table.
const newsletterSubscribersTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'newsletter_subscribers'"
  )
  .get();

if (!newsletterSubscribersTable) {
  sqlite.exec(`
    CREATE TABLE newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'form',
      token TEXT NOT NULL DEFAULT '',
      unsubscribed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: create the page-views analytics table.
const pageViewsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'page_views'")
  .get();

if (!pageViewsTable) {
  sqlite.exec(`
    CREATE TABLE page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      signals TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
}

// Backfill newsletter subscribers from existing welcome submissions (any
// field value that looks like an email). Runs once, then the homepage form
// and the admin "Sync từ popup" keep the list updated.
function randomToken(): string {
  return randomBytes(18).toString("base64url");
}
(function backfillNewsletterFromWelcome() {
  if (!newsletterSubscribersTable) return;
  const existing = sqlite
    .prepare("SELECT count(*) AS c FROM newsletter_subscribers")
    .get() as { c: number };
  if (existing.c > 0) return;
  const rows = sqlite
    .prepare("SELECT data FROM welcome_submissions")
    .all() as Array<{ data: string }>;
  const seen = new Set<string>();
  const insert = sqlite.prepare(
    "INSERT OR IGNORE INTO newsletter_subscribers (email, source, token, created_at) VALUES (?, 'welcome', ?, ?)"
  );
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  for (const row of rows) {
    try {
      const data = JSON.parse(row.data);
      if (!data || typeof data !== "object") continue;
      for (const value of Object.values(data) as string[]) {
        const email = typeof value === "string" ? value.trim().toLowerCase() : "";
        if (email && EMAIL_RE.test(email) && !seen.has(email)) {
          seen.add(email);
          insert.run(email, randomToken(), new Date().toISOString());
        }
      }
    } catch {
      /* ignore malformed rows */
    }
  }
})();

// Boot-time migration: create rate-limit table for the newsletter subscribe endpoint.
const newsletterRateLimitTable = sqlite
  .prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'newsletter_rate_limits'"
  )
  .get();

if (!newsletterRateLimitTable) {
  sqlite.exec(`
    CREATE TABLE newsletter_rate_limits (
      key TEXT PRIMARY KEY,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL
    );
  `);
}

// Boot-time migration: create the comments table (post comments, admin-moderated).
const commentsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'comments'")
  .get();

if (!commentsTable) {
  sqlite.exec(`
    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      website TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      visitor_id TEXT NOT NULL DEFAULT '',
      ip TEXT NOT NULL DEFAULT '',
      signals TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: create the post reactions (likes) table.
const reactionsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'post_reactions'")
  .get();

if (!reactionsTable) {
  sqlite.exec(`
    CREATE TABLE post_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      visitor_id TEXT NOT NULL DEFAULT '',
      reaction TEXT NOT NULL DEFAULT 'like',
      created_at TEXT NOT NULL,
      UNIQUE(post_id, visitor_id, reaction)
    );
  `);
}

// Boot-time migration: create rate-limit tables for comments & reactions.
for (const table of ["comment_rate_limits", "reaction_rate_limits"]) {
  const exists = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table);
  if (!exists) {
    sqlite.exec(`
      CREATE TABLE ${table} (
        key TEXT PRIMARY KEY,
        window_start INTEGER NOT NULL,
        count INTEGER NOT NULL
      );
    `);
  }
}

// Boot-time migration: add draft/publish columns to posts.
for (const [col, ddl] of [
  ["published", "INTEGER NOT NULL DEFAULT 0"],
  ["published_at", "TEXT NOT NULL DEFAULT ''"],
]) {
  const hasCol = sqlite
    .prepare(`SELECT name FROM pragma_table_info('posts') WHERE name = ?`)
    .get(col);
  if (!hasCol) {
    sqlite.exec(`ALTER TABLE posts ADD COLUMN ${col} ${ddl};`);
  }
}

// Existing posts were always public -> publish them all.
sqlite.exec(`UPDATE posts SET published = 1 WHERE published IS NULL OR published = 0;`);

// Boot-time migration: create the courses, lessons, and enrollments tables.
const coursesTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'courses'")
  .get();

if (!coursesTable) {
  sqlite.exec(`
    CREATE TABLE courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      level TEXT NOT NULL DEFAULT 'beginner',
      price INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      published INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      duration TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: create the configurable course-levels table and seed
// the default levels so the module works out of the box.
const courseLevelsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'course_levels'")
  .get();

if (!courseLevelsTable) {
  sqlite.exec(`
    CREATE TABLE course_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '🌱',
      color TEXT NOT NULL DEFAULT 'blue',
      sort_order INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const now = new Date().toISOString();
  const seed = sqlite.prepare(`
    INSERT INTO course_levels (key, label, description, icon, color, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const levels = [
    ["beginner", "Cơ bản", "Dành cho người mới bắt đầu", "🌱", "green", 1],
    ["intermediate", "Trung cấp", "Dành cho người đã nắm vững kiến thức nền tảng", "⚡", "amber", 2],
    ["advanced", "Nâng cao", "Dành cho lập trình viên muốn chuyên sâu", "🔥", "red", 3],
  ];
  for (const [key, label, description, icon, color, order] of levels) {
    seed.run(key, label, description, icon, color, order, now, now);
  }
}

// Idempotent fix: levels created before sort order became 1-based may hold
// sort_order = 0. Shift every row up by 1 once so ordering starts at 1.
const hasZeroSort = sqlite
  .prepare("SELECT COUNT(*) AS n FROM course_levels WHERE sort_order = 0")
  .get() as { n: number };
if (hasZeroSort.n > 0) {
  sqlite.prepare("UPDATE course_levels SET sort_order = sort_order + 1").run();
}

const lessonsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'course_lessons'")
  .get();

if (!lessonsTable) {
  sqlite.exec(`
    CREATE TABLE course_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      slug TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      video_url TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0,
      duration TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: give every lesson a URL-safe slug (kept out of the
// browser URL today, but used for the admin edit route so numeric ids never
// appear in the address bar).
const lessonSlugCol = sqlite
  .prepare(`SELECT name FROM pragma_table_info('course_lessons') WHERE name = 'slug'`)
  .get();
if (!lessonSlugCol) {
  sqlite.exec(`ALTER TABLE course_lessons ADD COLUMN slug TEXT NOT NULL DEFAULT '';`);
}
const lessonSlugStmt = sqlite.prepare(
  "SELECT id, title FROM course_lessons WHERE slug = '' OR slug IS NULL ORDER BY id"
);
const lessonSlugUsed = new Set<string>();
for (const row of lessonSlugStmt.all() as { id: number; title: string }[]) {
  const base = slugify(row.title) || "bai-hoc";
  let candidate = base;
  let n = 2;
  while (lessonSlugUsed.has(candidate)) {
    candidate = `${base}-${n++}`;
  }
  lessonSlugUsed.add(candidate);
  sqlite
    .prepare("UPDATE course_lessons SET slug = ? WHERE id = ?")
    .run(candidate, row.id);
}
sqlite.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_course_lessons_slug ON course_lessons(slug);"
);

const enrollmentsTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'course_enrollments'")
  .get();

if (!enrollmentsTable) {
  sqlite.exec(`
    CREATE TABLE course_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      user_email TEXT NOT NULL DEFAULT '',
      visitor_id TEXT NOT NULL DEFAULT '',
      progress INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

// Boot-time migration: add lesson-progress columns if missing.
for (const [col, ddl] of [
  ["completed", "INTEGER NOT NULL DEFAULT 0"],
]) {
  const hasCol = sqlite
    .prepare(`SELECT name FROM pragma_table_info('course_enrollments') WHERE name = ?`)
    .get(col);
  if (!hasCol) {
    sqlite.exec(`ALTER TABLE course_enrollments ADD COLUMN ${col} ${ddl};`);
  }
}

// Full-text search index over posts.
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title,
    description,
    tags,
    body,
    tokenize = 'unicode61 remove_diacritics 2'
  );
`);

const ftsInsertStmt = sqlite.prepare(
  "INSERT INTO posts_fts (rowid, title, description, tags, body) VALUES (?, ?, ?, ?, ?)"
);
const ftsDeleteStmt = sqlite.prepare("DELETE FROM posts_fts WHERE rowid = ?");
const ftsPostRow = sqlite.prepare(
  "SELECT id, title, description, tags, content FROM posts"
);
const ftsPostRowById = sqlite.prepare(
  "SELECT id, title, description, tags, content FROM posts WHERE id = ?"
);

function ftsValues(row: { id: number; title: string; description: string; tags: string; content: string }) {
  let tags = "";
  try {
    const parsed = JSON.parse(row.tags);
    if (Array.isArray(parsed)) tags = parsed.join(" ");
  } catch { /* ignore */ }
  return { id: row.id, title: row.title, description: row.description, tags, body: row.content };
}

export function rebuildSearchIndex() {
  sqlite.transaction(() => {
    sqlite.exec("DELETE FROM posts_fts");
    for (const row of ftsPostRow.all() as { id: number; title: string; description: string; tags: string; content: string }[]) {
      const v = ftsValues(row);
      ftsInsertStmt.run(v.id, v.title, v.description, v.tags, v.body);
    }
  })();
}

export function indexPost(id: number) {
  const row = ftsPostRowById.get(id) as { id: number; title: string; description: string; tags: string; content: string } | undefined;
  if (!row) return;
  ftsDeleteStmt.run(id);
  const v = ftsValues(row);
  ftsInsertStmt.run(v.id, v.title, v.description, v.tags, v.body);
}

export function unindexPost(id: number) {
  ftsDeleteStmt.run(id);
}

// Boot-time migration: AI provider + action profile tables.
const aiProvidersTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_providers'")
  .get();

if (!aiProvidersTable) {
  sqlite.exec(`
    CREATE TABLE ai_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_url TEXT NOT NULL,
      api_key TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      enabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migrate the legacy llm_* settings into the first provider (if any exist).
  const legacyRows = sqlite
    .prepare("SELECT key, value FROM settings WHERE key IN ('llm_base_url','llm_api_key','llm_model','llm_enabled')")
    .all() as Array<{ key: string; value: string }>;
  const legacy: Record<string, string> = {};
  for (const row of legacyRows) legacy[row.key] = row.value;
  const legacyBaseUrl = (legacy.llm_base_url || "").trim();
  const legacyApiKey = (legacy.llm_api_key || "").trim();
  if (legacyBaseUrl || legacyApiKey) {
    const now = new Date().toISOString();
    const host = legacyBaseUrl.replace(/^https?:\/\//i, "").split("/")[0] || "Nhà cung cấp";
    sqlite
      .prepare(
        `INSERT INTO ai_providers (name, base_url, api_key, model, enabled, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        host,
        legacyBaseUrl || "https://api.openai.com/v1",
        legacyApiKey,
        (legacy.llm_model || "").trim(),
        legacy.enabled === "0" ? 0 : 1,
        now,
        now
      );
  }
}

// Boot-time migration: create the AI action profiles table + seed defaults.
// Profiles belong to a specific provider (provider_id); each provider gets its
// own copy of the default action profiles so configs are never shared.
const aiProfilesTable = sqlite
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'ai_profiles'")
  .get();

if (!aiProfilesTable) {
  sqlite.exec(`
    CREATE TABLE ai_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER REFERENCES ai_providers(id),
      action TEXT NOT NULL,
      label TEXT NOT NULL,
      system_prompt TEXT NOT NULL DEFAULT '',
      temperature REAL NOT NULL DEFAULT 0.4,
      max_tokens INTEGER NOT NULL DEFAULT 1500,
      enabled INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL,
      UNIQUE(provider_id, action)
    );
  `);
} else {
  // Legacy tables used a single global action UNIQUE on `action` with no
  // provider link — rebuild the table so profiles can be per-provider.
  const profileCols = sqlite
    .prepare("PRAGMA table_info(ai_profiles)")
    .all() as Array<{ name: string }>;
  if (!profileCols.some((c) => c.name === "provider_id")) {
    sqlite.exec(`
      CREATE TABLE ai_profiles_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id INTEGER REFERENCES ai_providers(id),
        action TEXT NOT NULL,
        label TEXT NOT NULL,
        system_prompt TEXT NOT NULL DEFAULT '',
        temperature REAL NOT NULL DEFAULT 0.4,
        max_tokens INTEGER NOT NULL DEFAULT 1500,
        enabled INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        UNIQUE(provider_id, action)
      );
      INSERT INTO ai_profiles_new (id, provider_id, action, label, system_prompt, temperature, max_tokens, enabled, updated_at)
        SELECT id, NULL, action, label, system_prompt, temperature, max_tokens, enabled, updated_at FROM ai_profiles;
      DROP TABLE ai_profiles;
      ALTER TABLE ai_profiles_new RENAME TO ai_profiles;
    `);
  }
}

// Reassign legacy global profiles (provider_id NULL) to the oldest provider.
{
  const firstProvider = sqlite
    .prepare("SELECT id FROM ai_providers ORDER BY id ASC LIMIT 1")
    .get() as { id: number } | undefined;
  if (firstProvider) {
    sqlite
      .prepare(
        "UPDATE ai_profiles SET provider_id = ? WHERE provider_id IS NULL OR provider_id NOT IN (SELECT id FROM ai_providers)"
      )
      .run(firstProvider.id);
  }
}

// Seed a full default set of action profiles for each provider that lacks one.
{
  const providers = sqlite
    .prepare("SELECT id FROM ai_providers ORDER BY id ASC")
    .all() as Array<{ id: number }>;
  const now = new Date().toISOString();
  const seed = sqlite.prepare(
    `INSERT OR IGNORE INTO ai_profiles (provider_id, action, label, system_prompt, temperature, max_tokens, enabled, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
  );
  sqlite.transaction(() => {
    for (const p of providers) {
      for (const prof of DEFAULT_AI_PROFILES) {
        seed.run(
          p.id,
          prof.action,
          prof.label,
          prof.systemPrompt,
          prof.temperature,
          prof.maxTokens,
          now
        );
      }
    }
  })();
}

// Legacy cleanup: drop the retired "series" feature from existing DBs.
{
  const hasSeries = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'series'")
    .get();
  if (hasSeries) {
    sqlite.exec("DROP TABLE IF EXISTS series;");
  }
  for (const col of ["series_id", "series_order"]) {
    const hasCol = sqlite
      .prepare(`SELECT name FROM pragma_table_info('posts') WHERE name = ?`)
      .get(col);
    if (hasCol) {
      sqlite.exec(`ALTER TABLE posts DROP COLUMN ${col};`);
    }
  }
}

// Keep existing DBs in sync if the index was created empty.
if (ftsPostRow.all().length > 0 && (sqlite.prepare("SELECT count(*) as c FROM posts_fts").get() as { c: number }).c === 0) {
  rebuildSearchIndex();
}

export const db = drizzle(sqlite, { schema });
export const sqliteClient = sqlite;

// Create an automatic backup on boot when the configured interval has elapsed.
maybeAutoBackup();
