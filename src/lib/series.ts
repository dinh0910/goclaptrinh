import { asc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { series, posts } from "./db/schema";

export interface SeriesWithCount {
  id: number;
  slug: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface SeriesSimple {
  id: number;
  slug: string;
  name: string;
  icon: string;
}

export function getSeriesWithCounts(opts?: {
  includeUnpublished?: boolean;
}): SeriesWithCount[] {
  const countedPosts = opts?.includeUnpublished
    ? sql<number>`count(${posts.id})`
    : sql<number>`count(CASE WHEN ${posts.published} = 1 AND (${posts.publishedAt} = '' OR datetime(${posts.publishedAt}) <= datetime('now')) THEN ${posts.id} END)`;

  return (
    db
      .select({
        id: series.id,
        slug: series.slug,
        name: series.name,
        description: series.description,
        icon: series.icon,
        count: countedPosts,
      })
      .from(series)
      .leftJoin(posts, eq(posts.seriesId, series.id))
      .groupBy(series.id)
      .orderBy(asc(series.name))
      .all() as SeriesWithCount[]
  );
}

export function getAllSeriesSimple(): SeriesSimple[] {
  return db
    .select({ id: series.id, slug: series.slug, name: series.name, icon: series.icon })
    .from(series)
    .orderBy(asc(series.name))
    .all();
}

export function getSeriesBySlug(slug: string) {
  const row = db.select().from(series).where(eq(series.slug, slug)).get();
  return row ?? null;
}

export function getSeriesById(id: number) {
  const row = db.select().from(series).where(eq(series.id, id)).get();
  return row ?? null;
}

/**
 * Posts belonging to a series, ordered by `seriesOrder` then date (newest).
 * The `publishedOnly` flag is used by the public series pages.
 */
export function getSeriesPosts(slug: string, opts?: { publishedOnly?: boolean }) {
  const target = getSeriesBySlug(slug);
  if (!target) return [];

  return getSeriesPostsById(target.id, opts);
}

export function getSeriesPostsById(id: number, opts?: { publishedOnly?: boolean }) {
  const scoped = db
    .select()
    .from(posts)
    .where(eq(posts.seriesId, id))
    .all();

  const filtered = opts?.publishedOnly
    ? scoped.filter(
        (p) =>
          p.published &&
          (!p.publishedAt || new Date(p.publishedAt).getTime() <= Date.now())
      )
    : scoped;

  return filtered.sort((a, b) => {
    if (a.seriesOrder !== b.seriesOrder) return a.seriesOrder - b.seriesOrder;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}