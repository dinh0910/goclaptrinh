import { NextRequest, NextResponse } from "next/server";
import { getActiveWelcome } from "@/lib/welcome";
import { addWelcomeSubmission } from "@/lib/welcome-submissions";
import {
  computeFingerprint,
  getClientIp,
  normalizeSignals,
} from "@/lib/visitor";
import type { WelcomeFieldType } from "@/lib/welcome-config";
import { allowSubmit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,19}$/;

function isValid(type: WelcomeFieldType, value: string): boolean {
  switch (type) {
    case "email":
      return EMAIL_RE.test(value);
    case "phone":
      return PHONE_RE.test(value);
    case "number":
      return /^\d+([.,]\d+)?$/.test(value);
    default:
      return true;
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    itemId?: unknown;
    values?: unknown;
    visitorId?: unknown;
    signals?: unknown;
    website?: unknown;
  } | null;
  if (!body) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields that humans never see.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  if (typeof body.itemId !== "string") {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const signals = normalizeSignals(body.signals);
  const visitorId =
    typeof body.visitorId === "string" ? body.visitorId.trim().slice(0, 128) : "";
  const ip = getClientIp(request.headers);
  const fingerprint = computeFingerprint(signals);
  const rateKey = ip || fingerprint || visitorId || "anon";
  if (!allowSubmit(rateKey)) {
    return NextResponse.json(
      {
        error:
          "Bạn đã gửi quá nhiều lần trong thời gian ngắn. Vui lòng thử lại sau vài phút.",
      },
      { status: 429 }
    );
  }

  const item = getActiveWelcome();
  if (!item || item.id !== body.itemId || item.template !== "form") {
    return NextResponse.json(
      { error: "Form đăng ký này không còn hiển thị" },
      { status: 400 }
    );
  }

  const rawValues = body.values && typeof body.values === "object" ? body.values : {};
  const values = rawValues as Record<string, unknown>;
  const data: Record<string, string> = {};

  for (const field of item.fields) {
    const raw = values[field.id];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) {
      if (field.required) {
        return NextResponse.json(
          { error: `Vui lòng nhập ${field.label}` },
          { status: 400 }
        );
      }
      continue;
    }
    if (value.length > 500) {
      return NextResponse.json(
        { error: `${field.label} quá dài` },
        { status: 400 }
      );
    }
    if (!isValid(field.type, value)) {
      const hint =
        field.type === "email"
          ? "email không hợp lệ"
          : field.type === "phone"
            ? "số điện thoại không hợp lệ"
            : "giá trị không hợp lệ";
      return NextResponse.json(
        { error: `${field.label} — ${hint}` },
        { status: 400 }
      );
    }
    data[field.id] = value;
  }

  try {
    const client = {
      visitorId,
      signals,
      fingerprint,
      ip,
    };
    addWelcomeSubmission(item.id, data, client);
  } catch {
    return NextResponse.json(
      { error: "Không thể gửi đăng ký" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}