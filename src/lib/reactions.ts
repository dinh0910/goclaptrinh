import { sqliteClient } from "./db";

export interface ReactionCount {
  like: number;
}

export function getReactionCounts(postId: number): ReactionCount {
  const row = sqliteClient
    .prepare(
      "SELECT count(*) AS c FROM post_reactions WHERE post_id = ? AND reaction = 'like'"
    )
    .get(postId) as { c: number };
  return { like: Number(row.c) };
}

export function hasVisitorReacted(postId: number, visitorId: string): boolean {
  if (!visitorId) return false;
  const row = sqliteClient
    .prepare(
      "SELECT 1 AS one FROM post_reactions WHERE post_id = ? AND visitor_id = ? AND reaction = 'like' LIMIT 1"
    )
    .get(postId, visitorId) as { one: number } | undefined;
  return !!row;
}

export function toggleReaction(input: {
  postId: number;
  visitorId: string;
}): { liked: boolean; count: number } {
  const { postId, visitorId } = input;
  const safeVisitor = (visitorId || "").slice(0, 128);
  if (!safeVisitor) return { liked: false, count: getReactionCounts(postId).like };

  const existing = sqliteClient
    .prepare(
      "SELECT id FROM post_reactions WHERE post_id = ? AND visitor_id = ? AND reaction = 'like'"
    )
    .get(postId, safeVisitor) as { id: number } | undefined;

  if (existing) {
    sqliteClient.prepare("DELETE FROM post_reactions WHERE id = ?").run(existing.id);
    return { liked: false, count: getReactionCounts(postId).like };
  }

  sqliteClient
    .prepare(
      "INSERT OR IGNORE INTO post_reactions (post_id, visitor_id, reaction, created_at) VALUES (?, ?, 'like', ?)"
    )
    .run(postId, safeVisitor, new Date().toISOString());
  return { liked: true, count: getReactionCounts(postId).like };
}
