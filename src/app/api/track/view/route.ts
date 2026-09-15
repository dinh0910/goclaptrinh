import { NextRequest, NextResponse } from "next/server";
import { recordPageView } from "@/lib/analytics";
import {
  computeFingerprint,
  getClientIp,
  normalizeSignals,
} from "@/lib/visitor";
import { welcomeLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    path?: unknown;
    referrer?: unknown;
    visitorId?: unknown;
    signals?: unknown;
    website?: unknown;
  } | null;
  if (!body) return NextResponse.json({ success: true });

  // Honeypot for bot spam.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const path =
    typeof body.path === "string" ? body.path.trim().slice(0, 500) : "";
  const referrer =
    typeof body.referrer === "string"
      ? body.referrer.trim().slice(0, 500)
      : "";
  const visitorId =
    typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
  const signals = normalizeSignals(body.signals);
  const ip = getClientIp(request.headers);
  const fingerprint = computeFingerprint(signals);
  const rateKey = `pv:${ip || fingerprint || visitorId || "anon"}`;
  if (!welcomeLimiter.allow(rateKey)) {
    return NextResponse.json({ success: true });
  }

  recordPageView({ visitorId, path, referrer, ip, signals });
  return NextResponse.json({ success: true });
}