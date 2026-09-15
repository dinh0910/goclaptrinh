import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import {
  addSubscriber,
  getNewsletterCounts,
  listCampaigns,
  listSubscribers,
  removeSubscriber,
  syncFromWelcome,
} from "@/lib/newsletter";
import { getMailConfig, saveMailConfig } from "@/lib/mail";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireAuth([PERMISSIONS.newsletter]);
    if (!session) return unauthorizedJson();

    const cfg = getMailConfig();
    const counts = getNewsletterCounts();
    const subscribers = listSubscribers({ includeUnsubscribed: true });
    const campaigns = listCampaigns(20);

    return NextResponse.json({
      config: {
        provider: cfg.provider,
        hasKey: Boolean(cfg.apiKey),
        from: cfg.from,
        fromName: cfg.fromName,
      },
      counts,
      subscribers,
      campaigns,
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải dữ liệu newsletter" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.newsletter]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const apiKey = body.apiKey === null ? null : typeof body.apiKey === "string" ? body.apiKey : undefined;
    const provider = body.provider === "sendgrid" ? "sendgrid" : "resend";
    const from = typeof body.from === "string" ? body.from.trim() : undefined;
    const fromName = typeof body.fromName === "string" ? body.fromName.trim() : undefined;

    if (from !== undefined && from.length > 200) {
      return NextResponse.json({ error: "Email gửi (From) quá dài" }, { status: 400 });
    }

    if (apiKey !== null) saveMailConfig({ provider, apiKey, from, fromName });
    else saveMailConfig({ provider, from, fromName });

    logAudit({
      action: AUDIT_ACTIONS.newsletterSettings,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "newsletter_config",
      detail: { provider },
      ip: getClientIp(request.headers),
    });

    const saved = getMailConfig();
    return NextResponse.json({
      ok: true,
      config: {
        provider: saved.provider,
        hasKey: Boolean(saved.apiKey),
        from: saved.from,
        fromName: saved.fromName,
      },
    });
  } catch {
    return NextResponse.json({ error: "Không thể lưu cấu hình email" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.newsletter]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const action = body.action as string;

    if (action === "syncWelcome") {
      const added = syncFromWelcome();
      logAudit({
        action: AUDIT_ACTIONS.subscriberAdd,
        userId: session.user?.id as number | undefined,
        userEmail: session.user?.email as string | undefined,
        entity: "newsletter_subscriber",
        detail: { action: "sync-welcome", added },
        ip: getClientIp(request.headers),
      });
      return NextResponse.json({ ok: true, added });
    }

    const result = addSubscriber({
      email: typeof body.email === "string" ? body.email.trim() : "",
      name: typeof body.name === "string" ? body.name.trim() : "",
      source: "manual",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    logAudit({
      action: AUDIT_ACTIONS.subscriberAdd,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "newsletter_subscriber",
      entityId: String(result.subscriber?.id ?? ""),
      detail: { email: result.subscriber?.email ?? "", exists: !!result.exists },
      ip: getClientIp(request.headers),
    });
    return NextResponse.json({ ok: true, subscriber: result.subscriber ?? null, exists: !!result.exists });
  } catch {
    return NextResponse.json({ error: "Không thể thêm người nhận" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.newsletter]);
    if (!session) return unauthorizedJson();

    const id = Number(request.nextUrl.searchParams.get("id") || "");
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const removed = removeSubscriber(id);
    if (!removed) {
      return NextResponse.json({ error: "Không tìm thấy người nhận" }, { status: 404 });
    }
    logAudit({
      action: AUDIT_ACTIONS.subscriberRemove,
      userId: session.user?.id as number | undefined,
      userEmail: session.user?.email as string | undefined,
      entity: "newsletter_subscriber",
      entityId: String(id),
      ip: getClientIp(request.headers),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa người nhận" }, { status: 500 });
  }
}