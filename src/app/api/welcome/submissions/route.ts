import { NextRequest, NextResponse } from "next/server";
import { getWelcomeItems } from "@/lib/welcome";
import {
  deleteWelcomeSubmission,
  getWelcomeSubmissions,
} from "@/lib/welcome-submissions";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();

  const submissions = getWelcomeSubmissions();
  const items = getWelcomeItems();
  const itemById = new Map(items.map((i) => [i.id, i]));
  const nameById = new Map(items.map((i) => [i.id, i.name]));

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      ...s,
      popupName: nameById.get(s.itemId) || "Đã xóa",
      fields: itemById.get(s.itemId)?.fields ?? [],
    })),
  });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
  }

  try {
    deleteWelcomeSubmission(id);
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa đăng ký" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}