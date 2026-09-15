import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByToken, unsubscribeByToken } from "@/lib/newsletter";
import { getClientIp } from "@/lib/visitor";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() || "";
  const sub = getSubscriberByToken(token);
  if (!sub) {
    return NextResponse.json(
      { error: "Liên kết hủy đăng ký không hợp lệ" },
      { status: 400 }
    );
  }
  if (!sub.unsubscribed) {
    unsubscribeByToken(token);
    logAudit({
      action: AUDIT_ACTIONS.newsletterUnsubscribe,
      entity: "newsletter_subscriber",
      entityId: String(sub.id),
      detail: { email: sub.email },
      ip: getClientIp(request.headers),
    });
  }
  return NextResponse.json({
    success: true,
    message: "Bạn đã hủy đăng ký nhận bản tin thành công.",
  });
}