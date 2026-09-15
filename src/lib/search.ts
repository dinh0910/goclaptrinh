import { sqliteClient } from "@/lib/db";
import type { PostRow } from "@/lib/db/schema";
import { getCategoryBySlug } from "@/lib/categories";
import type { Post } from "@/lib/types";

export function buildFtsQuery(raw: string): string | null {
  const cleaned = raw
    .replace(/"/g, "")
    .replace(/\b(NEAR|AND|OR|NOT)\b/g, " ")
    .replace(/[()*]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  if (!cleaned) return null;
  const terms = [...new Set(cleaned.toLowerCase().split(/\s+/).filter(Boolean))];
  return terms.map((t) => `${t}*`).join(" AND ");
}

export function searchPosts(query: string): Post[] {
  const ftsQuery = buildFtsQuery(query);
  if (!ftsQuery) return [];

  const hits = sqliteClient
    .prepare(
      `SELECT p.slug, bm25(posts_fts) AS rank
       FROM posts p
       JOIN posts_fts ON posts_fts.rowid = p.id
       WHERE posts_fts MATCH ?
         AND p.published = 1
         AND (p.published_at = '' OR datetime(p.published_at) <= datetime('now'))
       ORDER BY rank
       LIMIT 50`
    )
    .all(ftsQuery) as { slug: string; rank: number }[];

  if (hits.length === 0) return [];

  const slugs = hits.map((h) => h.slug);
  const placeholders = slugs.map(() => "?").join(",");
  const rows = sqliteClient
    .prepare(`SELECT * FROM posts WHERE slug IN (${placeholders})`)
    .all(...slugs) as PostRow[];

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const ordered: PostRow[] = [];
  for (const hit of hits) {
    const row = bySlug.get(hit.slug);
    if (row) ordered.push(row);
  }

  return ordered.map((row) => {
    const { name, color } = (() => {
      const cat = getCategoryBySlug(row.category);
      return { name: cat?.name || row.category, color: cat?.color || "gray" };
    })();
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
      content: "",
      readingTime: row.readingTime,
      featured: row.featured,
    };
  });
}