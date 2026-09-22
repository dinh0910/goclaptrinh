import { sqliteClient } from "./db";

export interface AuditEntry {
  userId?: number | null;
  userEmail?: string;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}

const insertAudit = sqliteClient.prepare(`
  INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, detail, ip, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export function logAudit(entry: AuditEntry) {
  try {
    const detail = entry.detail ? JSON.stringify(entry.detail) : "{}";
    insertAudit.run(
      entry.userId ?? null,
      entry.userEmail ?? "",
      entry.action,
      entry.entity ?? "",
      entry.entityId ?? "",
      detail,
      entry.ip ?? "",
      new Date().toISOString()
    );
  } catch {
    // Audit logging must never break the primary operation.
  }
}

export function listAuditLogs(opts?: {
  limit?: number;
  offset?: number;
  action?: string;
  q?: string;
}) {
  const limit = Math.min(Math.max(opts?.limit ?? 100, 1), 200);
  const offset = Math.max(opts?.offset ?? 0, 0);

  const where: string[] = [];
  const params: (string | number)[] = [];

  if (opts?.action) {
    where.push("action = ?");
    params.push(opts.action);
  }
  if (opts?.q) {
    where.push(
      "(user_email LIKE ? OR entity LIKE ? OR entity_id LIKE ? OR detail LIKE ?)"
    );
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = sqliteClient
    .prepare(
      `SELECT * FROM audit_logs ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<{
    id: number;
    user_id: number | null;
    user_email: string;
    action: string;
    entity: string;
    entity_id: string;
    detail: string;
    ip: string;
    created_at: string;
  }>;

  const total = sqliteClient
    .prepare(`SELECT count(*) AS c FROM audit_logs ${whereSql}`)
    .get(...params) as { c: number };

  return {
    total: Number(total.c),
    rows: rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      userEmail: r.user_email,
      action: r.action,
      entity: r.entity,
      entityId: r.entity_id,
      detail: safeParse(r.detail),
      ip: r.ip,
      createdAt: r.created_at,
    })),
  };
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const AUDIT_ACTIONS = {
  loginSuccess: "login.success",
  loginFailed: "login.failed",
  logout: "logout",
  mfaSetup: "mfa.setup",
  mfaDisable: "mfa.disable",
  postCreate: "post.create",
  postUpdate: "post.update",
  postDelete: "post.delete",
  categoryCreate: "category.create",
  categoryUpdate: "category.update",
  categoryDelete: "category.delete",
  userCreate: "user.create",
  userUpdate: "user.update",
  userDelete: "user.delete",
  userResetPassword: "user.reset-password",
  roleCreate: "role.create",
  roleUpdate: "role.update",
  roleDelete: "role.delete",
  mediaCreate: "media.create",
  mediaUpdate: "media.update",
  mediaDelete: "media.delete",
  backupCreate: "backup.create",
  backupDelete: "backup.delete",
  backupRestore: "backup.restore",
  newsletterSubscribe: "newsletter.subscribe",
  newsletterUnsubscribe: "newsletter.unsubscribe",
  newsletterSettings: "newsletter.settings",
  newsletterTest: "newsletter.test-send",
  newsletterSend: "newsletter.send",
  subscriberAdd: "newsletter.subscriber-add",
  subscriberRemove: "newsletter.subscriber-remove",
  commentCreate: "comment.create",
  commentApprove: "comment.approve",
  commentReject: "comment.reject",
  commentDelete: "comment.delete",
  commentReport: "comment.report",
  commentReportHandle: "comment.report-handle",
  reactionToggle: "reaction.toggle",
  courseCreate: "course.create",
  courseUpdate: "course.update",
  courseDelete: "course.delete",
  lessonCreate: "lesson.create",
  lessonUpdate: "lesson.update",
  lessonDelete: "lesson.delete",
  courseLevelCreate: "course-level.create",
  courseLevelUpdate: "course-level.update",
  courseLevelDelete: "course-level.delete",
} as const;