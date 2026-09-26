import { sqliteClient } from "./db";
import { maskIp } from "./privacy";

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  userId: number;
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

// Bình luận trả cho người đọc: bỏ hẳn ip và signals vì đó là dữ liệu cá nhân,
// không có lý do để công khai. IP đã phục vụ mục đích rate-limit lúc ghi.
export type PublicComment = Omit<Comment, "ip" | "signals">;

export interface CommentReport {
  id: number;
  commentId: number;
  reporterId: number;
  reason: string;
  note: string;
  status: string;
  ip: string;
  createdAt: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CommentRow = {
  id: number;
  post_id: number;
  parent_id: number | null;
  user_id: number;
  name: string;
  email: string;
  website: string;
  content: string;
  status: string;
  visitor_id: string;
  ip: string;
  signals: string;
  created_at: string;
};

function commentBase(row: CommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    website: row.website,
    content: row.content,
    status: row.status,
    visitorId: row.visitor_id,
    createdAt: row.created_at,
  };
}

function rowToPublicComment(row: CommentRow): PublicComment {
  return commentBase(row);
}

function rowToComment(row: CommentRow): Comment {
  return {
    ...commentBase(row),
    // Che ở tầng data để IP gốc không rời khỏi server.
    ip: maskIp(row.ip),
    signals: (() => {
      try { return JSON.parse(row.signals || "{}"); } catch { return {}; }
    })(),
  };
}

export function addComment(input: {
  postId: number;
  userId: number;
  name: string;
  email: string;
  website?: string;
  content: string;
  parentId?: number | null;
  visitorId: string;
  ip: string;
  signals: Record<string, unknown>;
}): { ok: boolean; id?: number; error?: string } {
  const { postId, userId, name, email, content, visitorId, ip, signals } = input;
  const parentId = input.parentId ?? null;
  const website = input.website?.trim().slice(0, 300) ?? "";
  const cleanName = name.trim().slice(0, 80);
  const cleanEmail = email.trim().toLowerCase().slice(0, 200);
  const cleanContent = content.trim().slice(0, 5000);

  if (userId <= 0) return { ok: false, error: "Vui lòng đăng nhập để bình luận" };
  if (!cleanName) return { ok: false, error: "Vui lòng nhập tên" };
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) return { ok: false, error: "Email không hợp lệ" };
  if (!cleanContent) return { ok: false, error: "Vui lòng nhập nội dung bình luận" };

  const result = sqliteClient
    .prepare(
      `INSERT INTO comments (post_id, parent_id, user_id, name, email, website, content, status, visitor_id, ip, signals, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?)`
    )
    .run(
      postId,
      parentId,
      userId,
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

export function listPublicComments(postId: number): PublicComment[] {
  const rows = sqliteClient
    .prepare(
      "SELECT * FROM comments WHERE post_id = ? AND status = 'approved' ORDER BY created_at ASC"
    )
    .all(postId) as CommentRow[];
  return rows.map((r) => rowToPublicComment(r));
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
        user_id: r.user_id as number,
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

export function createCommentReport(input: {
  commentId: number;
  reporterId: number;
  reason: string;
  note?: string;
  ip?: string;
}): { ok: boolean; id?: number; error?: string } {
  const cleanReason = (input.reason || "").trim().slice(0, 100);
  const cleanNote = (input.note || "").trim().slice(0, 2000);
  if (input.commentId <= 0 || input.reporterId <= 0) {
    return { ok: false, error: "Dữ liệu báo cáo không hợp lệ" };
  }
  if (!cleanReason) return { ok: false, error: "Vui lòng chọn lý do báo cáo" };

  const comment = sqliteClient
    .prepare("SELECT id FROM comments WHERE id = ?")
    .get(input.commentId);
  if (!comment) return { ok: false, error: "Bình luận không tồn tại" };

  const existing = sqliteClient
    .prepare(
      "SELECT id FROM comment_reports WHERE comment_id = ? AND reporter_id = ? AND status = 'pending'"
    )
    .get(input.commentId, input.reporterId);
  if (existing) return { ok: false, error: "Bạn đã báo cáo bình luận này" };

  const result = sqliteClient
    .prepare(
      `INSERT INTO comment_reports (comment_id, reporter_id, reason, note, status, ip, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(
      input.commentId,
      input.reporterId,
      cleanReason,
      cleanNote,
      (input.ip || "").slice(0, 64),
      new Date().toISOString()
    );
  return { ok: true, id: Number(result.lastInsertRowid) };
}

export function listCommentReports(opts?: {
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
    where.push("r.status = ?");
    params.push(opts.status);
  }
  if (opts?.q) {
    where.push("(r.reason LIKE ? OR r.note LIKE ? OR c.content LIKE ? OR p.title LIKE ?)");
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = sqliteClient
    .prepare(
      `SELECT r.*,
              c.content AS comment_content,
              c.name AS commenter_name,
              c.email AS commenter_email,
              c.status AS comment_status,
              u.name AS reporter_name,
              u.email AS reporter_email,
              p.title AS post_title,
              p.slug AS post_slug
       FROM comment_reports r
       LEFT JOIN comments c ON c.id = r.comment_id
       LEFT JOIN users u ON u.id = r.reporter_id
       LEFT JOIN posts p ON p.id = c.post_id
       ${whereSql}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<Record<string, unknown> & {
    comment_content: string;
    commenter_name: string;
    commenter_email: string;
    comment_status: string;
    reporter_name: string;
    reporter_email: string;
    post_title: string;
    post_slug: string;
  }>;

  const total = sqliteClient
    .prepare(
      `SELECT count(*) AS c FROM comment_reports r
       LEFT JOIN comments c ON c.id = r.comment_id
       LEFT JOIN users u ON u.id = r.reporter_id
       LEFT JOIN posts p ON p.id = c.post_id
       ${whereSql}`
    )
    .get(...params) as { c: number };

  return {
    total: Number(total.c),
    rows: rows.map((r) => ({
      ...rowToReport(r),
      commentContent: (r.comment_content as string) || "",
      commenterName: (r.commenter_name as string) || "",
      commenterEmail: (r.commenter_email as string) || "",
      commentStatus: (r.comment_status as string) || "",
      reporterName: (r.reporter_name as string) || (r.reporter_email as string) || "",
      reporterEmail: (r.reporter_email as string) || "",
      postTitle: (r.post_title as string) || "",
      postSlug: (r.post_slug as string) || "",
      commentDeleted: r.comment_id == null,
    })),
  };
}

function rowToReport(row: Record<string, unknown>): CommentReport {
  return {
    id: Number(row.id),
    commentId: Number(row.comment_id),
    reporterId: Number(row.reporter_id),
    reason: (row.reason as string) || "",
    note: (row.note as string) || "",
    status: (row.status as string) || "",
    ip: maskIp((row.ip as string) || ""),
    createdAt: (row.created_at as string) || "",
  };
}

export function resolveCommentReport(id: number): boolean {
  const result = sqliteClient
    .prepare("UPDATE comment_reports SET status = 'resolved' WHERE id = ? AND status = 'pending'")
    .run(id);
  return result.changes > 0;
}

export function ignoreCommentReport(id: number): boolean {
  const result = sqliteClient
    .prepare("UPDATE comment_reports SET status = 'ignored' WHERE id = ? AND status = 'pending'")
    .run(id);
  return result.changes > 0;
}

export function getCommentReport(id: number): CommentReport | null {
  const row = sqliteClient
    .prepare("SELECT * FROM comment_reports WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;
  return row ? rowToReport(row) : null;
}

export function deleteCommentReport(id: number): boolean {
  const result = sqliteClient.prepare("DELETE FROM comment_reports WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getCommentReportCounts() {
  const counts = sqliteClient
    .prepare(
      `SELECT
         count(*) AS total,
         sum(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         sum(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
         sum(CASE WHEN status = 'ignored' THEN 1 ELSE 0 END) AS ignored
       FROM comment_reports`
    )
    .get() as { total: number; pending: number; resolved: number; ignored: number };
  return {
    total: Number(counts.total),
    pending: Number(counts.pending),
    resolved: Number(counts.resolved),
    ignored: Number(counts.ignored),
  };
}