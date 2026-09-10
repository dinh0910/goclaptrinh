import { NextResponse } from "next/server";
import { requireAuth, unauthorizedJson } from "@/lib/permissions";
import {
  getAdminTheme,
  setAdminTheme,
  type AdminTheme,
} from "@/lib/admin-prefs";

export async function GET() {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();
  return NextResponse.json({ theme: getAdminTheme(String(session.user.id)) });
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
  return NextResponse.json({ ok: true });
}