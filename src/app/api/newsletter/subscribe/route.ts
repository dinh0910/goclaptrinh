import { NextRequest, NextResponse } from "next/server";
import {
  addSubscriber,
  isValidEmail,
} from "@/lib/newsletter";
import {
  computeFingerprint,
  getClientIp,
  normalizeSignals,
} from "@/lib/visitor";
import { newsletterLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown;
    name?: unknown;
    website?: unknown;
    visitorId?: unknown;
    signals?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields that humans never see.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email không hợp lệ" }, { status: 400 });
  }

  const signals = normalizeSignals(body.signals);
  const visitorId =
    typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
  const ip = getClientIp(request.headers);
  const fingerprint = computeFingerprint(signals);
  const rateKey = ip || fingerprint || visitorId || email;
  if (!newsletterLimiter.allow(rateKey)) {
    return NextResponse.json(
      {
        error:
          "Bạn đã đăng ký quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau.",
      },
      { status: 429 }
    );
  }

  const result = addSubscriber({
    email,
    name: typeof body.name === "string" ? body.name.slice(0, 120) : "",
    source: "form",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.exists && !result.subscriber?.unsubscribed) {
    return NextResponse.json({ success: true, message: "Email đã đăng ký trước đó" });
  }
  return NextResponse.json({ success: true });
}