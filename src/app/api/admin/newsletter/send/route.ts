import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import {
  getNewsletterCounts,
  listSubscribers,
  saveCampaign,
  type NewsletterCampaign,
} from "@/lib/newsletter";
import { getMailConfig, sendEmail } from "@/lib/mail";
import { siteConfig } from "@/lib/constants";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const dynamic = "force-dynamic";

const CHUNK_SIZE = 25;

function buildFooter(): string {
  return `<p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
    Bạn nhận được email này vì đã đăng ký nhận bản tin từ ${siteConfig.name}.<br/>
    <a href="${siteConfig.url}/api/newsletter/unsubscribe?token=%TOKEN%" style="color:#6b7280;">Hủy đăng ký</a>
  </p>`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.newsletter]);
    if (!session) return unauthorizedJson();

    const cfg = getMailConfig();
    if (!cfg.apiKey || !cfg.from) {
      return NextResponse.json(
        { error: "Chưa cấu hình email gửi trong Cài đặt" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const subject =
      typeof body.subject === "string" ? body.subject.trim() : "";
    const html = typeof body.html === "string" ? body.html.trim() : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!subject || !html) {
      return NextResponse.json({ error: "Vui lòng nhập tiêu đề và nội dung" }, { status: 400 });
    }

    // Test send to a single address.
    if (typeof body.testTo === "string" && body.testTo.trim()) {
      const result = await sendEmail({
        to: body.testTo.trim(),
        subject: `[TEST] ${subject}`,
        html: html + buildFooter().replace("%TOKEN%", "test"),
        text: text || subject,
      });
      if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
      logAudit({
        action: AUDIT_ACTIONS.newsletterTest,
        userId: session.user?.id as number | undefined,
        userEmail: session.user?.email as string | undefined,
        entity: "newsletter",
        detail: { to: body.testTo.trim(), subject },
        ip: getClientIp(request.headers),
      });
      return NextResponse.json({ ok: true, sent: 1, test: true });
    }

    const subscribers = listSubscribers({ includeUnsubscribed: false });
    const total = subscribers.length;
    const offset = Number.isInteger(body.offset) ? Math.max(Number(body.offset), 0) : 0;
    const chunk = subscribers.slice(offset, offset + CHUNK_SIZE);

    let sent = 0;
    let failed = 0;
    let firstError = "";
    for (const sub of chunk) {
      const result = await sendEmail({
        to: sub.email,
        subject,
        html: html + buildFooter().replace("%TOKEN%", sub.token),
        text: text || subject,
      });
      if (result.ok) sent += 1;
      else {
        failed += 1;
        if (!firstError) firstError = result.error;
      }
    }

    const nextOffset = offset + chunk.length;
    const done = nextOffset >= total;

    let campaignSentAt = "";
    if (done) {
      campaignSentAt = new Date().toISOString();
      const campaign: NewsletterCampaign = {
        id: `c-${Date.now().toString(36)}`,
        subject,
        provider: cfg.provider,
        sentAt: campaignSentAt,
        total,
        ok: offset + sent,
        failed,
      };
      saveCampaign(campaign);
      logAudit({
        action: AUDIT_ACTIONS.newsletterSend,
        userId: session.user?.id as number | undefined,
        userEmail: session.user?.email as string | undefined,
        entity: "newsletter",
        entityId: campaign.id,
        detail: { subject, total, ok: campaign.ok, failed },
        ip: getClientIp(request.headers),
      });
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      firstError: firstError || undefined,
      nextOffset,
      total,
      done,
      counts: done ? getNewsletterCounts() : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi gửi email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}