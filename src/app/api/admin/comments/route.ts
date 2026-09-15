import { NextRequest, NextResponse } from "next/server";
import {
  listCommentsAdmin,
  approveComment,
  rejectComment,
  deleteComment,
  getCommentCounts,
} from "@/lib/comments";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.comments]);
    if (!session) return unauthorizedJson();

    const status = request.nextUrl.searchParams.get("status") || undefined;
    const q = request.nextUrl.searchParams.get("q") || undefined;
    const limit = Number(request.nextUrl.searchParams.get("limit") || "50");
    const offset = Number(request.nextUrl.searchParams.get("offset") || "0");

    const result = listCommentsAdmin({ status, q, limit, offset });
    const counts = getCommentCounts();
    return NextResponse.json({ ...result, counts });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách bình luận" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.comments]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const action = body.action as string;
    const id = Number(body.id || 0);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const auditAction =
      action === "approve"
        ? AUDIT_ACTIONS.commentApprove
        : action === "reject"
          ? AUDIT_ACTIONS.commentReject
          : null;
    if (!auditAction) {
      return NextResponse.json({ error: "Hành động không hỗ trợ" }, { status: 400 });
    }

    const ok = action === "approve" ? approveComment(id) : rejectComment(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });
    }

    logAudit({
      action: auditAction,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "comment",
      entityId: String(id),
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật bình luận" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.comments]);
    if (!session) return unauthorizedJson();

    const id = Number(request.nextUrl.searchParams.get("id") || "");
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const ok = deleteComment(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy bình luận" }, { status: 404 });
    }

    logAudit({
      action: AUDIT_ACTIONS.commentDelete,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "comment",
      entityId: String(id),
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa bình luận" }, { status: 500 });
  }
}