import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import {
  appendMessage,
  deleteConversation,
  getChatCounts,
  getConversationById,
  listConversationsAdmin,
  listMessages,
  markConversationRead,
  setConversationStatus,
} from "@/lib/chat";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LEN = 2000;

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.chat]);
    if (!session) return unauthorizedJson();

    const id = Number(request.nextUrl.searchParams.get("id") || "");

    // Single conversation detail (messages) when `id` is present.
    if (id) {
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
      }
      const conversation = getConversationById(id);
      if (!conversation) {
        return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
      }
      const messages = listMessages(id);
      markConversationRead(id, "admin");
      return NextResponse.json({ conversation, messages });
    }

    const status = request.nextUrl.searchParams.get("status") || undefined;
    const q = request.nextUrl.searchParams.get("q") || undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") || "100");
    const offset = Number(request.nextUrl.searchParams.get("offset") || "0");

    const result = listConversationsAdmin({ status, q, limit, offset });
    return NextResponse.json({ ...result, counts: getChatCounts() });
  } catch {
    return NextResponse.json({ error: "Không tải được danh sách tin nhắn" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.chat]);
    if (!session) return unauthorizedJson();

    const body = (await request.json().catch(() => null)) as {
      conversationId?: unknown;
      content?: unknown;
    } | null;
    if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

    const conversationId = Number(body.conversationId || 0);
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return NextResponse.json({ error: "Hội thoại không hợp lệ" }, { status: 400 });
    }

    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      return NextResponse.json({ error: "Vui lòng nhập nội dung" }, { status: 400 });
    }
    if (content.length > MAX_MESSAGE_LEN) {
      return NextResponse.json(
        { error: `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LEN} ký tự)` },
        { status: 400 }
      );
    }

    const conversation = getConversationById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }

    const senderName = (session.user?.name || session.user?.email || "Hỗ trợ").toString();
    const result = appendMessage({
      conversationId,
      sender: "admin",
      senderName,
      content,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logAudit({
      action: AUDIT_ACTIONS.chatAdminReply,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "chat-conversation",
      entityId: String(conversationId),
      detail: { preview: content.slice(0, 120) },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, messageId: result.id, messages: listMessages(conversationId) });
  } catch {
    return NextResponse.json({ error: "Không gửi được tin nhắn" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.chat]);
    if (!session) return unauthorizedJson();

    const body = (await request.json().catch(() => null)) as {
      conversationId?: unknown;
      status?: unknown;
    } | null;
    if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

    const conversationId = Number(body.conversationId || 0);
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return NextResponse.json({ error: "Hội thoại không hợp lệ" }, { status: 400 });
    }
    const status = body.status === "closed" ? "closed" : "open";
    if (!setConversationStatus(conversationId, status)) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }

    logAudit({
      action: AUDIT_ACTIONS.chatStatusChange,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "chat-conversation",
      entityId: String(conversationId),
      detail: { status },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Không cập nhật được hội thoại" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.chat]);
    if (!session) return unauthorizedJson();

    const id = Number(request.nextUrl.searchParams.get("id") || "");
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    if (!deleteConversation(id)) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }

    logAudit({
      action: AUDIT_ACTIONS.chatDelete,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "chat-conversation",
      entityId: String(id),
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không xóa được hội thoại" }, { status: 500 });
  }
}
