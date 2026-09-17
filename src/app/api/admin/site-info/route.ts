import { NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { isValidEmail } from "@/lib/validation";
import { getSiteInfo, saveSiteInfo, type SiteInfo } from "@/lib/site-info";
import { DEFAULT_BAR_COLOR, normalizeHexColor } from "@/lib/bar-colors";

function clamp(text: unknown, max: number): string {
  return typeof text === "string" ? text.trim().slice(0, max) : "";
}

function normalizeBarColor(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_BAR_COLOR;
  const normalized = normalizeHexColor(value);
  return normalized || DEFAULT_BAR_COLOR;
}

export async function GET() {
  const session = await requireAuth([PERMISSIONS.all]);
  if (!session) return unauthorizedJson();
  return NextResponse.json(getSiteInfo());
}

export async function PUT(request: Request) {
  const session = await requireAuth([PERMISSIONS.all]);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as
    | { email?: unknown; phone?: unknown; announcement?: unknown; announcementUrl?: unknown; barColor?: unknown }
    | null;

  const email = clamp(body?.email, 200);
  const phone = clamp(body?.phone, 30);
  const announcement = clamp(body?.announcement, 300);
  const announcementUrl = clamp(body?.announcementUrl, 300);
  const barColor = normalizeBarColor(body?.barColor);

  if (email && !isValidEmail(email)) {
    return NextResponse.json(
      { error: "Địa chỉ email không hợp lệ" },
      { status: 400 }
    );
  }
  if (phone && !/^[0-9+\-().\s]+$/.test(phone)) {
    return NextResponse.json(
      { error: "Số điện thoại không hợp lệ" },
      { status: 400 }
    );
  }
  if (announcementUrl && !/^https?:\/\/.+/.test(announcementUrl)) {
    return NextResponse.json(
      { error: "Đường dẫn liên kết phải bắt đầu bằng http:// hoặc https://" },
      { status: 400 }
    );
  }

  const info: SiteInfo = { email, phone, announcement, announcementUrl, barColor };
  saveSiteInfo(info);
  return NextResponse.json(info);
}