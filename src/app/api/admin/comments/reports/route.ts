import { NextRequest, NextResponse } from "next/server";
import {
  listCommentReports,
  resolveCommentReport,
  ignoreCommentReport,
  deleteCommentReport,
  getCommentReport,
  getCommentReportCounts,
  deleteComment,
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

    const result = listCommentReports({ status, q, limit, offset });
    const counts = getCommentReportCounts();
    return NextResponse.json({ ...result, counts });
  } catch {
    return NextResponse.json({ error: "Không thể tải danh sách báo cáo" }, { status: 500 });
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

    let ok = false;
    if (action === "resolve") ok = resolveCommentReport(id);
    else if (action === "ignore") ok = ignoreCommentReport(id);
    else {
      return NextResponse.json({ error: "Hành động không hỗ trợ" }, { status: 400 });
    }

    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy báo cáo" }, { status: 404 });
    }

    logAudit({
      action: AUDIT_ACTIONS.commentReportHandle,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "comment-report",
      entityId: String(id),
      detail: { action },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật báo cáo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.comments]);
    if (!session) return unauthorizedJson();

    const id = Number(request.nextUrl.searchParams.get("id") || "");
    const deleteCommentFlag = request.nextUrl.searchParams.get("deleteComment") === "1";
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const report = getCommentReport(id);
    const ok = deleteCommentReport(id);
    if (!ok) {
      return NextResponse.json({ error: "Không tìm thấy báo cáo" }, { status: 404 });
    }

    if (deleteCommentFlag && report) {
      deleteComment(report.commentId);
    }

    logAudit({
      action: AUDIT_ACTIONS.commentDelete,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "comment-report",
      entityId: String(id),
      detail: { deleteComment: deleteCommentFlag },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa báo cáo" }, { status: 500 });
  }
}