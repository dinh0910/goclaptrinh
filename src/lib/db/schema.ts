import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
  readingTime: text("reading_time").notNull().default("5 phút đọc"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type PostRow = typeof posts.$inferSelect;
export type PostInsert = typeof posts.$inferInsert;
