import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { categories, posts } from "./db/schema";

export const DEFAULT_CATEGORY_ICON = "📁";
export const DEFAULT_CATEGORY_COLOR = "gray";

export interface CategoryWithCount {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
}

export function getCategoriesWithCounts(opts?: {
  includeUnpublished?: boolean;
}): CategoryWithCount[] {
  const countedPosts = opts?.includeUnpublished
    ? count(posts.id)
    : sql<number>`count(CASE WHEN ${posts.published} = 1 AND (${posts.publishedAt} = '' OR datetime(${posts.publishedAt}) <= datetime('now')) THEN ${posts.id} END)`;

  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      color: categories.color,
      count: countedPosts,
    })
    .from(categories)
    .leftJoin(posts, eq(posts.category, categories.slug))
    .groupBy(categories.id)
    .orderBy(asc(categories.name))
    .all() as CategoryWithCount[];
}

export function getCategoryBySlug(slug: string) {
  return db.select().from(categories).where(eq(categories.slug, slug)).get() ?? null;
}