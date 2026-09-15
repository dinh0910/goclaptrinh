import { NextRequest, NextResponse } from "next/server";
import { toggleReaction, hasVisitorReacted, getReactionCounts } from "@/lib/reactions";
import { getClientIp, normalizeSignals, computeFingerprint } from "@/lib/visitor";
import { reactionLimiter } from "@/lib/rate-limit";
import { sqliteClient } from "@/lib/db";

export const dynamic = "force-dynamic";

function resolvePostId(slug: string): number | null {
  const row = sqliteClient
    .prepare("SELECT id FROM posts WHERE slug = ?")
    .get(slug) as { id: number } | undefined;
  return row?.id ?? null;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() || "";
  const visitorId = request.nextUrl.searchParams.get("visitorId")?.trim() || "";
  if (!slug) return NextResponse.json({ liked: false, count: 0 });

  const postId = resolvePostId(slug);
  if (!postId) return NextResponse.json({ liked: false, count: 0 });

  const liked = hasVisitorReacted(postId, visitorId);
  const { like } = getReactionCounts(postId);
  return NextResponse.json({ liked, count: like });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    slug?: unknown;
    visitorId?: unknown;
    signals?: unknown;
    website?: unknown;
  } | null;

  if (!body) return NextResponse.json({ liked: false, count: 0 });

  // Honeypot
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ liked: false, count: 0 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const visitorId = typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
  if (!slug || !visitorId) {
    return NextResponse.json({ liked: false, count: 0 });
  }

  const signals = normalizeSignals(body.signals);
  const ip = getClientIp(request.headers);
  const fingerprint = computeFingerprint(signals);
  const rateKey = `react:${ip || fingerprint || visitorId}`;

  if (!reactionLimiter.allow(rateKey)) {
    return NextResponse.json({ error: "Thao tác quá nhanh, vui lòng thử lại sau." }, { status: 429 });
  }

  const postId = resolvePostId(slug);
  if (!postId) return NextResponse.json({ liked: false, count: 0 });

  const result = toggleReaction({ postId, visitorId });
  return NextResponse.json({ liked: result.liked, count: result.count });
}