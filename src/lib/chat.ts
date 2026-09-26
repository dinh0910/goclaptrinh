import { sqliteClient } from "./db";
import { maskIp } from "./privacy";

export type ChatSender = "client" | "admin";

export interface ChatConversation {
  id: number;
  userId: number;
  visitorId: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  unreadForAdmin: number;
  unreadForClient: number;
  ip: string;
  signals: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  sender: ChatSender;
  senderName: string;
  content: string;
  createdAt: string;
}

interface ConversationRow {
  id: number;
  user_id: number;
  visitor_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  last_message_at: string;
  last_message_preview: string;
  unread_for_admin: number;
  unread_for_client: number;
  ip: string;
  signals: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: number;
  conversation_id: number;
  sender: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const MAX_MESSAGE_LEN = 2000;
const PREVIEW_LEN = 120;

function parseSignals(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function rowToConversation(row: ConversationRow): ChatConversation {
  return {
    id: row.id,
    userId: row.user_id,
    visitorId: row.visitor_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    lastMessageAt: row.last_message_at,
    lastMessagePreview: row.last_message_preview,
    unreadForAdmin: row.unread_for_admin,
    unreadForClient: row.unread_for_client,
    // Che ngay ở tầng data để IP gốc không bao giờ đi vào payload gửi admin.
    ip: maskIp(row.ip),
    signals: parseSignals(row.signals),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender === "admin" ? "admin" : "client",
    senderName: row.sender_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

const selectConversationById = sqliteClient.prepare(
  "SELECT * FROM chat_conversations WHERE id = ?"
);

const selectConversationByVisitor = sqliteClient.prepare(
  "SELECT * FROM chat_conversations WHERE visitor_id = ? ORDER BY id DESC LIMIT 1"
);

const selectConversationByUser = sqliteClient.prepare(
  "SELECT * FROM chat_conversations WHERE user_id = ? ORDER BY id DESC LIMIT 1"
);

const insertConversation = sqliteClient.prepare(
  `INSERT INTO chat_conversations
     (user_id, visitor_id, name, email, phone, status, last_message_at, last_message_preview,
      unread_for_admin, unread_for_client, ip, signals, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, 'open', '', '', 0, 0, ?, ?, ?, ?)`
);

const insertMessage = sqliteClient.prepare(
  `INSERT INTO chat_messages (conversation_id, sender, sender_name, content, created_at)
   VALUES (?, ?, ?, ?, ?)`
);

const touchConversation = sqliteClient.prepare(
  `UPDATE chat_conversations
     SET last_message_at = ?, last_message_preview = ?, updated_at = ?,
         unread_for_admin = unread_for_admin + ?, unread_for_client = unread_for_client + ?,
         status = CASE WHEN status = 'closed' THEN 'open' ELSE status END
   WHERE id = ?`
);

const selectMessages = sqliteClient.prepare(
  "SELECT * FROM chat_messages WHERE conversation_id = ? ORDER BY id ASC"
);

/**
 * Resolve the conversation belonging to this visitor. A signed-in user is
 * matched by user id first so the history follows the account across devices;
 * anonymous visitors fall back to the browser visitor id.
 */
export function getOrCreateConversation(input: {
  userId?: number;
  visitorId: string;
  name?: string;
  email?: string;
  phone?: string;
  ip: string;
  signals: Record<string, unknown>;
}): ChatConversation {
  const userId = input.userId ?? 0;
  const visitorId = input.visitorId.slice(0, 128);
  const name = (input.name || "").trim().slice(0, 80);
  const email = (input.email || "").trim().toLowerCase().slice(0, 200);
  const phone = (input.phone || "").trim().slice(0, 32);
  const now = new Date().toISOString();

  const existing =
    (userId > 0
      ? (selectConversationByUser.get(userId) as ConversationRow | undefined)
      : undefined) ??
    (visitorId ? (selectConversationByVisitor.get(visitorId) as ConversationRow | undefined) : undefined);

  if (existing) {
    // Keep the profile fresh without overwriting a name the visitor typed.
    if (name || email || phone || input.ip) {
      sqliteClient
        .prepare(
          `UPDATE chat_conversations
             SET name = CASE WHEN ? != '' THEN ? ELSE name END,
                 email = CASE WHEN ? != '' THEN ? ELSE email END,
                 phone = CASE WHEN ? != '' THEN ? ELSE phone END,
                 ip = CASE WHEN ? != '' THEN ? ELSE ip END
           WHERE id = ?`
        )
        .run(name, name, email, email, phone, phone, input.ip, input.ip, existing.id);
    }
    return rowToConversation(
      selectConversationById.get(existing.id) as ConversationRow
    );
  }

  const result = insertConversation.run(
    userId,
    visitorId,
    name,
    email,
    phone,
    input.ip.slice(0, 64),
    JSON.stringify(input.signals || {}),
    now,
    now
  );

  return rowToConversation(
    selectConversationById.get(Number(result.lastInsertRowid)) as ConversationRow
  );
}

/**
 * Look up the conversation belonging to this visitor without creating one.
 * Used by the read path so simply opening the widget never leaves an empty
 * thread behind in the support inbox.
 */
export function findConversation(userId: number, visitorId: string): ChatConversation | null {
  const row =
    (userId > 0
      ? (selectConversationByUser.get(userId) as ConversationRow | undefined)
      : undefined) ??
    (visitorId ? (selectConversationByVisitor.get(visitorId) as ConversationRow | undefined) : undefined);
  return row ? rowToConversation(row) : null;
}

export function getConversationById(id: number): ChatConversation | null {
  const row = selectConversationById.get(id) as ConversationRow | undefined;
  return row ? rowToConversation(row) : null;
}

export function appendMessage(input: {
  conversationId: number;
  sender: ChatSender;
  senderName: string;
  content: string;
}): { ok: boolean; id?: number; error?: string } {
  const content = input.content.trim().slice(0, MAX_MESSAGE_LEN);
  if (!content) return { ok: false, error: "Vui lòng nhập nội dung tin nhắn" };

  const conversation = getConversationById(input.conversationId);
  if (!conversation) return { ok: false, error: "Hội thoại không tồn tại" };

  const now = new Date().toISOString();
  const senderName = (input.senderName || "").trim().slice(0, 80);
  const result = insertMessage.run(
    input.conversationId,
    input.sender,
    senderName,
    content,
    now
  );

  const preview =
    content.length > PREVIEW_LEN ? `${content.slice(0, PREVIEW_LEN)}…` : content;
  const bumpAdmin = input.sender === "client" ? 1 : 0;
  const bumpClient = input.sender === "admin" ? 1 : 0;
  touchConversation.run(now, preview, now, bumpAdmin, bumpClient, input.conversationId);

  return { ok: true, id: Number(result.lastInsertRowid) };
}

export function listMessages(conversationId: number): ChatMessage[] {
  const rows = selectMessages.all(conversationId) as MessageRow[];
  return rows.map(rowToMessage);
}

export function markConversationRead(
  conversationId: number,
  reader: ChatSender
): boolean {
  const column = reader === "admin" ? "unread_for_admin" : "unread_for_client";
  const result = sqliteClient
    .prepare(
      `UPDATE chat_conversations SET ${column} = 0, updated_at = ? WHERE id = ?`
    )
    .run(new Date().toISOString(), conversationId);
  return result.changes > 0;
}

export function setConversationStatus(
  conversationId: number,
  status: "open" | "closed"
): boolean {
  const result = sqliteClient
    .prepare("UPDATE chat_conversations SET status = ?, updated_at = ? WHERE id = ?")
    .run(status, new Date().toISOString(), conversationId);
  return result.changes > 0;
}

export function deleteConversation(conversationId: number): boolean {
  return sqliteClient.transaction(() => {
    sqliteClient
      .prepare("DELETE FROM chat_messages WHERE conversation_id = ?")
      .run(conversationId);
    const result = sqliteClient
      .prepare("DELETE FROM chat_conversations WHERE id = ?")
      .run(conversationId);
    return result.changes > 0;
  })();
}

export function listConversationsAdmin(opts?: {
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
    where.push(
      "(c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.last_message_preview LIKE ?)"
    );
    const like = `%${opts.q}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = sqliteClient
    .prepare(
      `SELECT c.*, (SELECT count(*) FROM chat_messages m WHERE m.conversation_id = c.id) AS message_count
       FROM chat_conversations c
       ${whereSql}
       ORDER BY COALESCE(NULLIF(c.last_message_at, ''), c.created_at) DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset) as Array<ConversationRow & { message_count: number }>;

  const total = sqliteClient
    .prepare(`SELECT count(*) AS c FROM chat_conversations c ${whereSql}`)
    .get(...params) as { c: number };

  return {
    total: Number(total.c),
    rows: rows.map((r) => ({
      ...rowToConversation(r),
      messageCount: Number(r.message_count),
    })),
  };
}

export function getChatCounts() {
  const counts = sqliteClient
    .prepare(
      `SELECT
         count(*) AS total,
         sum(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open,
         sum(CASE WHEN unread_for_admin > 0 THEN 1 ELSE 0 END) AS unread
       FROM chat_conversations`
    )
    .get() as { total: number; open: number; unread: number };
  return {
    total: Number(counts.total),
    open: Number(counts.open),
    unread: Number(counts.unread),
  };
}
