import { NextRequest, NextResponse } from "next/server";
import { createCommentReport } from "@/lib/comments";
import { getClientIp } from "@/lib/visitor";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để báo cáo" },
      { status: 401 }
    );
  }
  const userId = Number(session.user.id || 0);
  const userEmail = (session.user.email || "").trim() || undefined;
  if (userId <= 0) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để báo cáo" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    commentId?: unknown;
    reason?: unknown;
    note?: unknown;
  } | null;

  if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const commentId = Number(body.commentId || 0);
  const reason = typeof body.reason === "string" ? body.reason : "";
  const note = typeof body.note === "string" ? body.note : "";

  const result = createCommentReport({
    commentId,
    reporterId: userId,
    reason,
    note,
    ip: getClientIp(request.headers),
  });

  if (!result.ok) {
    const status = result.error === "Bạn đã báo cáo bình luận này" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  logAudit({
    action: AUDIT_ACTIONS.commentReport,
    userId,
    userEmail,
    entity: "comment",
    entityId: String(commentId),
    detail: { reason, note },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ success: true, id: result.id });
}