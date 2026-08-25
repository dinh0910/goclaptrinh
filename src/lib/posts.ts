import { remark } from "remark";
import html from "remark-html";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { posts, type PostRow } from "./db/schema";
import { Post } from "./types";
import { embedUrlsToIframes } from "./embeds";

function rowToPost(row: PostRow, contentHtml: string): Post {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.date,
    category: row.category,
    tags: (row.tags as string[]) || [],
    author: row.author,
    image: row.image || "",
    content: contentHtml,
    readingTime: row.readingTime,
    featured: row.featured,
  };
}

function renderContent(rawContent: string, contentHtml: string): string {
  const source = rawContent || contentHtml;
  if (!source) return "";
  const hasHtmlTags = /<[^>]+>/.test(source);
  const hasMarkdownSyntax = /^#{1,6}\s|^\*\*|^\- |^\d+\. |```|^\|/m.test(source);
  let rendered: string;
  if (hasHtmlTags && !hasMarkdownSyntax) {
    rendered = source;
  } else {
    rendered = remark().use(html).processSync(source).toString();
  }
  return embedUrlsToIframes(rendered);
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const row = db.select().from(posts).where(eq(posts.slug, slug)).get();
  if (!row) throw new Error(`Post not found: ${slug}`);
  const contentHtml = renderContent(row.rawContent || "", row.content);
  return rowToPost(row, contentHtml);
}

export async function getAllPosts(): Promise<Post[]> {
  const rows = db.select().from(posts).all();
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

export function getAllPostSlugs(): string[] {
  const rows = db.select({ slug: posts.slug }).from(posts).all();
  return rows.map((r) => r.slug);
}

export function getAllCategories(): Record<string, number> {
  const rows = db
    .select({
      category: sql<string>`lower(${posts.category})`,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .groupBy(posts.category)
    .all();

  const result: Record<string, number> = {};
  for (const row of rows) {
    result[row.category] = row.count;
  }
  return result;
}

export function getAllTags(): Record<string, number> {
  const rows = db.select({ tags: posts.tags }).from(posts).all();
  const tagCount: Record<string, number> = {};

  for (const row of rows) {
    const tags = (row.tags as string[]) || [];
    for (const tag of tags) {
      const t = tag.toLowerCase();
      tagCount[t] = (tagCount[t] || 0) + 1;
    }
  }
  return tagCount;
}
