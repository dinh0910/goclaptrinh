import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getWelcomeItems, setWelcomeItems } from "@/lib/welcome";
import { normalizeItem } from "@/lib/welcome-config";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();
  return NextResponse.json({ items: getWelcomeItems() });
}

export async function PUT(request: NextRequest) {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as {
    items?: unknown;
  } | null;
  const raw = body?.items;
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "Danh sách không hợp lệ" },
      { status: 400 }
    );
  }

  if (raw.length === 0) {
    return NextResponse.json(
      { error: "Cần ít nhất một popup giới thiệu" },
      { status: 400 }
    );
  }

  const items = (raw as unknown[])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map(normalizeItem);

  const untitled = items.find((i) => !i.title.trim());
  if (untitled) {
    return NextResponse.json(
      {
        error: `Popup "${untitled.name || "Chưa đặt tên"}" chưa có tiêu đề`,
      },
      { status: 400 }
    );
  }

  try {
    setWelcomeItems(items);
    revalidatePath("/");
  } catch {
    return NextResponse.json(
      { error: "Không thể lưu danh sách popup" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, items });
}