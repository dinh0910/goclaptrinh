import fs from "fs";
import path from "path";
import readingTime from "reading-time";
import bcrypt from "bcrypt";
import { remark } from "remark";
import remarkHtml from "remark-html";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { posts, users } from "../src/lib/db/schema";

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content };
  const raw = match[1];
  const body = match[2];
  const data: Record<string, unknown> = {};
  for (const line of raw.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val: string | string[] = line.slice(colonIdx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      val = val.slice(1, -1).split(",").map((s: string) => s.trim().replace(/^"|"$/g, ""));
    } else {
      val = val.replace(/^"|"$/g, "");
    }
    data[key] = val;
  }
  return { data, content: body };
}

const dbPath = path.join(process.cwd(), "data", "blog.db");

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'Admin',
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TEXT NOT NULL
  )
`);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    author TEXT NOT NULL DEFAULT 'Góc Lập Trình',
    image TEXT DEFAULT '',
    featured INTEGER NOT NULL DEFAULT 0,
    content TEXT NOT NULL,
    raw_content TEXT NOT NULL DEFAULT '',
    reading_time TEXT NOT NULL DEFAULT '5 phút đọc',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

// Seed admin user
const ADMIN_EMAIL = "admin@goclaptrinh.io.vn";
const ADMIN_PASSWORD = "admin123";

async function seedAdmin() {
  const existing = sqlite.prepare("SELECT id FROM users WHERE email = ?").get(ADMIN_EMAIL);
  if (existing) {
    console.log(`Admin user ${ADMIN_EMAIL} already exists, skipping.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const now = new Date().toISOString();

  db.insert(users).values({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    name: "Admin",
    role: "admin",
    createdAt: now,
  }).run();

  console.log(`✓ Admin user seeded: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log(`  ⚠️  Change this password in production!`);
}

// Seed posts from MD files
const postsDir = path.join(process.cwd(), "content", "posts");

function seedPosts() {
  if (!fs.existsSync(postsDir)) {
    console.log("content/posts/ not found. Skipping post seed.");
    return;
  }

  sqlite.exec("DELETE FROM posts");

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  console.log(`Found ${files.length} posts to seed...`);

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const fullPath = path.join(postsDir, file);
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = parseFrontmatter(fileContents);
    const stats = readingTime(content);
    const now = new Date().toISOString();

    db.insert(posts).values({
      slug,
      title: (data.title as string) || "",
      description: (data.description as string) || "",
      date: (data.date as string) || "",
      category: (data.category as string) || "",
      tags: (data.tags as string[]) || [],
      author: (data.author as string) || "Góc Lập Trình",
      image: (data.image as string) || "",
      featured: (data.featured as boolean) || false,
      content: remark().use(remarkHtml).processSync(content).toString(),
      rawContent: content,
      readingTime: stats.text.replace("min read", "phút đọc"),
      createdAt: now,
      updatedAt: now,
    }).run();

    console.log(`  ✓ ${slug}`);
  }

  console.log(`Seeded ${files.length} posts into ${dbPath}`);
}

async function main() {
  await seedAdmin();
  seedPosts();
  sqlite.close();
}

main();
