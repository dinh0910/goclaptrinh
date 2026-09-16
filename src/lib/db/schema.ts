import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { VisitorSignals } from "@/lib/visitor";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default("Admin"),
  role: text("role").notNull().default("admin"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  totpSecret: text("totp_secret").notNull().default(""),
  totpEnabled: integer("totp_enabled", { mode: "boolean" }).notNull().default(false),
});

export const roles = sqliteTable("roles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  permissions: text("permissions", { mode: "json" }).notNull().$type<string[]>().default([]),
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
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  publishedAt: text("published_at").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("📁"),
  color: text("color").notNull().default("gray"),
});

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull().unique(),
  url: text("url").notNull(),
  originalName: text("original_name").notNull().default(""),
  mimeType: text("mime_type").notNull().default("image/jpeg"),
  size: integer("size").notNull().default(0),
  width: integer("width").notNull().default(0),
  height: integer("height").notNull().default(0),
  originalWidth: integer("original_width").notNull().default(0),
  originalHeight: integer("original_height").notNull().default(0),
  title: text("title").notNull().default(""),
  altText: text("alt_text").notNull().default(""),
  description: text("description").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default("{}"),
});

export const aiProviders = sqliteTable("ai_providers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  apiKey: text("api_key").notNull().default(""),
  model: text("model").notNull().default(""),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const aiProfiles = sqliteTable(
  "ai_profiles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    providerId: integer("provider_id").references(() => aiProviders.id),
    action: text("action").notNull(),
    label: text("label").notNull(),
    systemPrompt: text("system_prompt").notNull().default(""),
    temperature: integer("temperature", { mode: "number" }).notNull().default(0.4),
    maxTokens: integer("max_tokens").notNull().default(1500),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => [uniqueIndex("ai_profiles_provider_action").on(table.providerId, table.action)]
);

export const welcomeSubmissions = sqliteTable("welcome_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: text("item_id").notNull(),
  data: text("data", { mode: "json" })
    .notNull()
    .$type<Record<string, string>>()
    .default({}),
  visitorId: text("visitor_id").notNull().default(""),
  signals: text("signals", { mode: "json" })
    .notNull()
    .$type<Partial<VisitorSignals>>()
    .default({}),
  fingerprint: text("fingerprint").notNull().default(""),
  ip: text("ip").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  userEmail: text("user_email").notNull().default(""),
  action: text("action").notNull(),
  entity: text("entity").notNull().default(""),
  entityId: text("entity_id").notNull().default(""),
  detail: text("detail", { mode: "json" })
    .notNull()
    .$type<Record<string, unknown>>()
    .default({}),
  ip: text("ip").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  source: text("source").notNull().default("form"),
  token: text("token").notNull().default(""),
  unsubscribed: integer("unsubscribed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const pageViews = sqliteTable("page_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  visitorId: text("visitor_id").notNull().default(""),
  path: text("path").notNull().default(""),
  referrer: text("referrer").notNull().default(""),
  ip: text("ip").notNull().default(""),
  signals: text("signals", { mode: "json" })
    .notNull()
    .$type<Partial<VisitorSignals>>()
    .default({}),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  parentId: integer("parent_id"),
  name: text("name").notNull().default(""),
  email: text("email").notNull().default(""),
  website: text("website").notNull().default(""),
  content: text("content").notNull(),
  status: text("status").notNull().default("pending"),
  visitorId: text("visitor_id").notNull().default(""),
  ip: text("ip").notNull().default(""),
  signals: text("signals", { mode: "json" })
    .notNull()
    .$type<Partial<VisitorSignals>>()
    .default({}),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const postReactions = sqliteTable("post_reactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  visitorId: text("visitor_id").notNull().default(""),
  reaction: text("reaction").notNull().default("like"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const courseLevels = sqliteTable("course_levels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  icon: text("icon").notNull().default("🌱"),
  color: text("color").notNull().default("blue"),
  sortOrder: integer("sort_order").notNull().default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  image: text("image").notNull().default(""),
  level: text("level").notNull().default("beginner"),
  price: integer("price").notNull().default(0),
  category: text("category").notNull().default(""),
  tags: text("tags", { mode: "json" }).notNull().$type<string[]>().default([]),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  duration: text("duration").notNull().default(""),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const courseLessons = sqliteTable("course_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  slug: text("slug").notNull().default(""),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
  duration: text("duration").notNull().default(""),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const courseEnrollments = sqliteTable("course_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").notNull(),
  userEmail: text("user_email").notNull().default(""),
  visitorId: text("visitor_id").notNull().default(""),
  progress: integer("progress").notNull().default(0),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type RoleRow = typeof roles.$inferSelect;
export type RoleInsert = typeof roles.$inferInsert;
export type PostRow = typeof posts.$inferSelect;
export type PostInsert = typeof posts.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type MediaRow = typeof media.$inferSelect;
export type MediaInsert = typeof media.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type AuditLogInsert = typeof auditLogs.$inferInsert;
export type NewsletterSubscriberRow = typeof newsletterSubscribers.$inferSelect;
export type NewsletterSubscriberInsert = typeof newsletterSubscribers.$inferInsert;
export type PageViewRow = typeof pageViews.$inferSelect;
export type PageViewInsert = typeof pageViews.$inferInsert;
export type CommentRow = typeof comments.$inferSelect;
export type CommentInsert = typeof comments.$inferInsert;
export type PostReactionRow = typeof postReactions.$inferSelect;
export type PostReactionInsert = typeof postReactions.$inferInsert;
export type AiProviderRow = typeof aiProviders.$inferSelect;
export type AiProviderInsert = typeof aiProviders.$inferInsert;
export type AiProfileRow = typeof aiProfiles.$inferSelect;
export type AiProfileInsert = typeof aiProfiles.$inferInsert;
export type CourseRow = typeof courses.$inferSelect;
export type CourseInsert = typeof courses.$inferInsert;
export type CourseLevelRow = typeof courseLevels.$inferSelect;
export type CourseLevelInsert = typeof courseLevels.$inferInsert;
export type CourseLessonRow = typeof courseLessons.$inferSelect;
export type CourseLessonInsert = typeof courseLessons.$inferInsert;
export type CourseEnrollmentRow = typeof courseEnrollments.$inferSelect;
export type CourseEnrollmentInsert = typeof courseEnrollments.$inferInsert;
