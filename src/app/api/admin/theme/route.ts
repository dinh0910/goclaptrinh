import { NextResponse } from "next/server";
import { requireAuth, unauthorizedJson } from "@/lib/permissions";
import {
  getAdminTheme,
  setAdminTheme,
  type AdminTheme,
} from "@/lib/admin-prefs";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function withCookie(res: NextResponse, theme: AdminTheme) {
  res.cookies.set("admin_theme", theme, COOKIE_OPTIONS);
  return res;
}

export async function GET() {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();
  const theme = getAdminTheme(String(session.user.id));
  return withCookie(NextResponse.json({ theme }), theme);
}

export async function PUT(request: Request) {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as {
    theme?: unknown;
  } | null;
  const theme = body?.theme;
  if (theme !== "light" && theme !== "dark") {
    return NextResponse.json(
      { error: "Giá trị theme không hợp lệ" },
      { status: 400 }
    );
  }

  setAdminTheme(String(session.user.id), theme as AdminTheme);
  return withCookie(NextResponse.json({ ok: true }), theme as AdminTheme);
}