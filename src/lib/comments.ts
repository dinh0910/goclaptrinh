import { sqliteClient } from "./db";

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  name: string;
  email: string;
  website: string;
  content: string;
  status: string;
  visitorId: string;
  ip: string;
  signals: Record<string, unknown>;
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rowToComment(row: {
  id: number;
  post_id: number;
  parent_id: number | null;
  name: string;
  email: string;
  website: string;
  content: string;
  status: string;
  visitor_id: string;
  ip: string;
  signals: string;
  created_at: string;
}): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    name: row.name,
    email: row.email,
    website: row.website,
    content: row.content,
    status: row.status,
    visitorId: row.visitor_id,
    ip: row.ip,
    signals: (() => {
      try { return JSON.parse(row.signals || "{}"); } catch { return {}; }
    })(),
    createdAt: row.created_at,
  };
}

export function addComment(input: {
  postId: number;
  name: string;
  email: string;
  website?: string;
  content: string;
  parentId?: number | null;
  visitorId: string;
  ip: string;
  signals: Record<string, unknown>;
}): { ok: boolean; id?: number; error?: string } {
  const { postId, name, email, content, visitorId, ip, signals } = input;
  const parentId = input.parentId ?? null;
  const website = input.website?.trim().slice(0, 300) ?? "";
  const cleanName = name.trim().slice(0, 80);
  const cleanEmail = email.trim().toLowerCase().slice(0, 200);
  const cleanContent = content.trim().slice(0, 5000);

  if (!cleanName) return { ok: false, error: "Vui lòng nhập tên" };
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) return { ok: false, error: "Email không hợp lệ" };
  if (!cleanContent) return { ok: false, error: "Vui lòng nhập nội dung bình luận" };

  const result = sqliteClient
    .prepare(
      `INSERT INTO comments (post_id, parent_id, name, email, website, content, status, visitor_id, ip, signals, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
    )
    .run(
      postId,
      parentId,
      cleanName,
      cleanEmail,
      website,
      cleanContent,
      (visitorId || "").slice(0, 128),
      (ip || "").slice(0, 64),
      JSON.stringify(signals || {}),
      new Date().toISOString()
    );
  return { ok: true, id: Number(result.lastInsertRowid) };
}

export function listPublicComments(postId: number): Comment[] {
  const rows = sqliteClient
    .prepare(
      "SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC"
    )
    .all(postId) as Record<string, unknown>[];
  return rows.map((r) => rowToComment(r as Parameters<typeof rowToComment>[0]));
}

export function getPostCommentCount(postId: number): number {
  const row = sqliteClient
    .prepare("SELECT count(*) AS c FROM comments WHERE post_id = ? AND status = 'approved'")
    .get(postId) as { c: number };
  return Number(row.c);
}

export function listCommentsAdmin(opts?: {
  status?: string;
  q?: string;
  limit?: number;
  offset?: number;
}) {
  const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 200);
  const offset = Math.max(opts?.offset ?? 0, 0);
  const where: string[] = [];
  const params: (string | number)[] = [];

  if (opts?.status) {
    where.push("c.status = ?");
    params.push(opts.status);
  }
  if (opts?.q) {
    where.push("(c.name LIKE ? OR c.email LIKE ? OR c.content LIKE ? OR p.title LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = sqliteClient
    .prepare(
      `SELECT c.*, p.title AS post_title, p.slug AS post_slug
       FROM comments c
       LEFT JOIN posts p ON p.id = c.post_id
       ${whereSql}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<Record<string, unknown> & {
    post_title: string;
    post_slug: string;
  }>;

  const total = sqliteClient
    .prepare(
      `SELECT count(*) AS c FROM comments c
       LEFT JOIN posts p ON p.id = c.post_id
       ${whereSql}`
    )
    .get(...params) as { c: number };

  return {
    total: Number(total.c),
    rows: rows.map((r) => ({
      ...rowToComment({
        id: r.id as number,
        post_id: r.post_id as number,
        parent_id: r.parent_id as number | null,
        name: r.name as string,
        email: r.email as string,
        website: r.website as string,
        content: r.content as string,
        status: r.status as string,
        visitor_id: r.visitor_id as string,
        ip: r.ip as string,
        signals: r.signals as string,
        created_at: r.created_at as string,
      }),
      postTitle: (r.post_title as string) || "",
      postSlug: (r.post_slug as string) || "",
    })),
  };
}

export function approveComment(id: number): boolean {
  const result = sqliteClient
    .prepare("UPDATE comments SET status = 'approved' WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export function rejectComment(id: number): boolean {
  const result = sqliteClient
    .prepare("UPDATE comments SET status = 'rejected' WHERE id = ?")
    .run(id);
  return result.changes > 0;
}

export function deleteComment(id: number): boolean {
  const result = sqliteClient.prepare("DELETE FROM comments WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getCommentCounts() {
  const counts = sqliteClient
    .prepare(
      `SELECT
         count(*) AS total,
         sum(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         sum(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
         sum(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
       FROM comments`
    )
    .get() as { total: number; pending: number; approved: number; rejected: number };
  return {
    total: Number(counts.total),
    pending: Number(counts.pending),
    approved: Number(counts.approved),
    rejected: Number(counts.rejected),
  };
}