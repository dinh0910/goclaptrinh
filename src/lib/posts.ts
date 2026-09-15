import { remark } from "remark";
import html from "remark-html";
import { eq, sql } from "drizzle-orm";
import { db, sqliteClient } from "./db";
import { posts, type PostRow } from "./db/schema";
import { Post } from "./types";
import { getCategoryBySlug } from "./categories";
import { embedUrlsToIframes } from "./embeds";

export interface PostQueryOptions {
  /** Include drafts and posts scheduled for a future date. Admin-only. */
  includeUnpublished?: boolean;
}

function isPubliclyVisible(row: Pick<PostRow, "published" | "publishedAt">): boolean {
  if (!row.published) return false;
  if (!row.publishedAt) return true;
  return new Date(row.publishedAt).getTime() <= Date.now();
}

function applyPublishFilter(rows: PostRow[], opts?: PostQueryOptions): PostRow[] {
  if (opts?.includeUnpublished) return rows;
  return rows.filter(isPubliclyVisible);
}

export function isPostPubliclyVisible(row: Pick<PostRow, "published" | "publishedAt">): boolean {
  return isPubliclyVisible(row);
}

/** Server-only helper: returns the integer primary key for a slug, or null. */
export function getPostIdBySlug(slug: string): number | null {
  const row = sqliteClient
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(slug) as { id: number } | undefined;
  return row?.id ?? null;
}

function categoryDisplayName(slug: string): { name: string; color: string } {
  const cat = getCategoryBySlug(slug);
  return { name: cat?.name || slug, color: cat?.color || "gray" };
}

function rowToPost(row: PostRow, contentHtml: string): Post {
  const { name, color } = categoryDisplayName(row.category);
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.date,
    category: row.category,
    categoryName: name,
    categoryColor: color,
    tags: (row.tags as string[]) || [],
    author: row.author,
    image: row.image || "",
    content: contentHtml,
    readingTime: row.readingTime,
    featured: row.featured,
    published: row.published,
    publishedAt: row.publishedAt || "",
    seriesId: row.seriesId ?? undefined,
    seriesOrder: row.seriesOrder,
  };
}

function renderContent(rawContent: string, contentHtml: string): string {
  const source = rawContent || contentHtml;
  if (!source) return "";
  if (/<[^>]+>/.test(source)) {
    return embedUrlsToIframes(source);
  }
  const rendered = remark().use(html).processSync(source).toString();
  return embedUrlsToIframes(rendered);
}

export async function getPostBySlug(
  slug: string,
  opts?: PostQueryOptions
): Promise<Post> {
  const row = db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!row) throw new Error(`Post not found: ${slug}`);
  if (!isPostPubliclyVisible(row) && !opts?.includeUnpublished) {
    throw new Error(`Post not found: ${slug}`);
  }
  const contentHtml = renderContent(row.rawContent || "", row.content);
  return rowToPost(row, contentHtml);
}

export async function getAllPosts(opts?: PostQueryOptions): Promise<Post[]> {
  const rows = applyPublishFilter(db.select().from(posts).all(), opts);
  const rendered = rows.map((row) => {
    const contentHtml = renderContent(row.rawContent || "", row.content);
    return rowToPost(row, contentHtml);
  });
  return rendered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getPostsByCategory(category: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllPostSlugs(opts?: PostQueryOptions): string[] {
  const rows = applyPublishFilter(db.select().from(posts).all(), opts);
  return rows.map((r) => r.slug);
}

export function getAllCategories(opts?: PostQueryOptions): Record<string, number> {
  const query = db
    .select({
      category: sql<string>`lower(${posts.category})`,
      count: sql<number>`count(*)`,
    })
    .from(posts);

  if (!opts?.includeUnpublished) {
    // Only count posts that are currently visible to the public.
    query.where(
      sql`${posts.published} = 1 AND (
        ${posts.publishedAt} = '' OR datetime(${posts.publishedAt}) <= datetime('now')
      )`
    );
  }

  const rows = query.groupBy(posts.category).all();

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = row.count;
  }
  return result;
}

export function getAllTags(opts?: PostQueryOptions): Record<string, number> {
  const source = opts?.includeUnpublished
    ? db.select({ tags: posts.tags }).from(posts).all()
    : db
        .select({ tags: posts.tags })
        .from(posts)
        .where(
          sql`${posts.published} = 1 AND (
            ${posts.publishedAt} = '' OR datetime(${posts.publishedAt}) <= datetime('now')
          )`
        )
        .all();
  const tagCount: Record<string, number> = {};

  for (const row of source) {
    const tags = (row.tags as string[]) || [];
    for (const tag of tags) {
      const t = tag.toLowerCase();
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  return tagCount;
}
