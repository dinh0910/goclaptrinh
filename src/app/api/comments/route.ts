import { NextRequest, NextResponse } from "next/server";
import { addComment, listPublicComments } from "@/lib/comments";
import { getClientIp, computeFingerprint, normalizeSignals } from "@/lib/visitor";
import { commentLimiter } from "@/lib/rate-limit";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { sqliteClient } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!slug) return NextResponse.json({ error: "Thiếu slug" }, { status: 400 });

  const post = sqliteClient
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(slug) as { id: number } | undefined;
  if (!post) return NextResponse.json({ comments: [], total: 0 });

  const comments = listPublicComments(post.id);
  return NextResponse.json({ comments, total: comments.length });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để bình luận" },
      { status: 401 }
    );
  }
  const userId = Number(session.user.id || 0);
  const userName = (session.user.name || "").trim();
  const userEmail = (session.user.email || "").trim();
  if (userId <= 0) {
    return NextResponse.json(
      { error: "Vui lòng đăng nhập để bình luận" },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    slug?: unknown;
    website?: unknown;
    content?: unknown;
    parentId?: unknown;
    visitorId?: unknown;
    signals?: unknown;
    honeypot?: unknown;
  } | null;

  if (!body) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  // Honeypot: bots fill hidden fields that humans never see.
  if (typeof body.honeypot === "string" && body.honeypot.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return NextResponse.json({ error: "Bài viết không hợp lệ" }, { status: 400 });

  const signals = normalizeSignals(body.signals);
  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
  const ip = getClientIp(request.headers);
  const fingerprint = computeFingerprint(signals);
  const rateKey = ip || fingerprint || visitorId || `u${userId}`;

  if (!commentLimiter.allow(rateKey)) {
    return NextResponse.json(
      { error: "Bạn đã bình luận quá nhiều lần. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  // Resolve slug → postId
  const postRow = sqliteClient
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(slug) as { id: number } | undefined;
  if (!postRow) {
    return NextResponse.json({ error: "Bài viết không tồn tại" }, { status: 404 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (content.length > 5000) {
    return NextResponse.json({ error: "Bình luận quá dài (tối đa 5000 ký tự)" }, { status: 400 });
  }

  const parentId =
    typeof body.parentId === "number" && body.parentId > 0 ? body.parentId : null;

  const result = addComment({
    postId: postRow.id,
    userId,
    name: userName || `Thành viên #${userId}`,
    email: userEmail,
    website: typeof body.website === "string" ? body.website : "",
    content,
    parentId,
    visitorId,
    ip,
    signals: { ...signals },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  logAudit({
    action: AUDIT_ACTIONS.commentCreate,
    userId,
    userEmail,
    entity: "comment",
    entityId: String(result.id),
    detail: { slug, name: userName, email: userEmail, parentId },
    ip,
  });

  return NextResponse.json({ success: true, id: result.id });
}