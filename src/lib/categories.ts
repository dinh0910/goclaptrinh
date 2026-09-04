import { asc, count, eq } from "drizzle-orm";
import { db } from "./db";
import { categories, posts } from "./db/schema";

export const DEFAULT_CATEGORY_ICON = "📁";

export interface CategoryWithCount {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export function getCategoriesWithCounts(): CategoryWithCount[] {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      count: count(posts.id),
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