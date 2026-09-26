import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  appendMessage,
  findConversation,
  getOrCreateConversation,
  listMessages,
  markConversationRead,
  setConversationStatus,
} from "@/lib/chat";
import { chatLimiter } from "@/lib/rate-limit";
import { getClientIp, normalizeSignals } from "@/lib/visitor";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

const MAX_MESSAGE_LEN = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;

/**
 * Resolve who is writing. A signed-in session wins so the conversation follows
 * the account; otherwise the browser visitor id identifies the guest.
 */
async function identify(visitorId: string) {
  const session = await auth();
  if (session?.user) {
    return {
      userId: Number(session.user.id || 0),
      visitorId,
      name: (session.user.name || "").trim(),
      email: (session.user.email || "").trim(),
    };
  }
  return { userId: 0, visitorId, name: "", email: "" };
}

export async function GET(request: NextRequest) {
  try {
    const visitorId =
      request.nextUrl.searchParams.get("visitorId")?.trim().slice(0, 128) || "";
    const session = await auth();
    const userId = Number(session?.user?.id || 0);

    // No session and no visitor id -> nothing to look up.
    if (userId <= 0 && !visitorId) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    // Read-only lookup: never create a thread just because someone opened the widget.
    const conversation = findConversation(userId, visitorId);
    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    const messages = listMessages(conversation.id);
    markConversationRead(conversation.id, "client");

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        name: conversation.name,
        email: conversation.email,
        phone: conversation.phone,
        createdAt: conversation.createdAt,
      },
      messages,
    });
  } catch {
    return NextResponse.json({ error: "Không tải được tin nhắn" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      visitorId?: unknown;
      signals?: unknown;
      content?: unknown;
      name?: unknown;
      email?: unknown;
      phone?: unknown;
      honeypot?: unknown;
    } | null;

    if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

    // Honeypot: silently succeed so bots get no signal.
    if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
      return NextResponse.json({ ok: true, messages: [] });
    }

    const visitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (content.length > MAX_MESSAGE_LEN) {
      return NextResponse.json(
        { error: `Tin nhắn quá dài (tối đa ${MAX_MESSAGE_LEN} ký tự)` },
        { status: 400 }
      );
    }
    if (!content && !visitorId) {
      return NextResponse.json({ error: "Vui lòng nhập nội dung tin nhắn" }, { status: 400 });
    }

    const ip = getClientIp(request.headers);
    const signals = normalizeSignals(body.signals);
    const identity = await identify(visitorId);
    const userId = identity.userId;

    if (!userId && !visitorId) {
      return NextResponse.json({ error: "Không xác định được người gửi" }, { status: 400 });
    }

    // Khách phải để lại thông tin liên hệ trước khi gửi tin nhắn đầu tiên —
    // không có cách nào để liên hệ lại nếu họ không cho biết ai họ là.
    const name = (typeof body.name === "string" ? body.name.trim() : "").slice(0, 80);
    const email = (typeof body.email === "string" ? body.email.trim() : "")
      .toLowerCase()
      .slice(0, 200);
    const phone = (typeof body.phone === "string" ? body.phone.trim() : "").slice(0, 32);

    if (!userId && content) {
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Vui lòng nhập họ và tên" },
          { status: 400 }
        );
      }
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
      }
      if (!PHONE_RE.test(phone)) {
        return NextResponse.json(
          { error: "Số điện thoại không hợp lệ" },
          { status: 400 }
        );
      }
    }

    if (content) {
      const rateKey = ip || visitorId || `u${userId}`;
      if (!chatLimiter.allow(rateKey)) {
        return NextResponse.json(
          { error: "Bạn gửi tin quá nhiều. Vui lòng đợi một chút." },
          { status: 429 }
        );
      }
    }

    const conversation = getOrCreateConversation({
      userId,
      visitorId: identity.visitorId,
      // Tài khoản đã đăng nhập lấy tên/email từ session, chỉ bổ sung số điện thoại.
      name: userId > 0 ? identity.name : name,
      email: userId > 0 ? identity.email : email,
      phone,
      ip,
      signals: { ...signals },
    });

    if (content) {
      const result = appendMessage({
        conversationId: conversation.id,
        sender: "client",
        senderName: conversation.name || conversation.email || "Khách",
        content,
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      logAudit({
        action: AUDIT_ACTIONS.chatClientSend,
        userId: userId || null,
        userEmail: identity.email,
        entity: "chat-conversation",
        entityId: String(conversation.id),
        detail: { preview: content.slice(0, 120) },
        ip,
      });
    }

    return NextResponse.json({
      ok: true,
      conversation: { id: conversation.id, status: conversation.status },
      messages: listMessages(conversation.id),
    });
  } catch {
    return NextResponse.json({ error: "Không gửi được tin nhắn" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      visitorId?: unknown;
      status?: unknown;
    } | null;
    if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

    const status = body.status === "closed" ? "closed" : "open";
    const visitorId =
      typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
    const session = await auth();
    const userId = Number(session?.user?.id || 0);
    if (userId <= 0 && !visitorId) {
      return NextResponse.json({ error: "Không xác định được hội thoại" }, { status: 400 });
    }

    const conversation = findConversation(userId, visitorId);
    if (!conversation) {
      return NextResponse.json({ error: "Không tìm thấy hội thoại" }, { status: 404 });
    }
    setConversationStatus(conversation.id, status);

    return NextResponse.json({ ok: true, status });
  } catch {
    return NextResponse.json({ error: "Không cập nhật được hội thoại" }, { status: 500 });
  }
}
