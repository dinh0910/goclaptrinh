import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default("Admin"),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  category: text("category").notNull(),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  author: text("author").notNull().default("Góc Lập Trình"),
  image: text("image").default(""),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  content: text("content").notNull(),
  rawContent: text("raw_content").notNull().default(""),
  readingTime: text("reading_time").notNull().default("5 phút đọc"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type PostRow = typeof posts.$inferSelect;
export type PostInsert = typeof posts.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
