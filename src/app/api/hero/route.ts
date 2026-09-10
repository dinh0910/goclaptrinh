import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getHeroPresets,
  saveHeroPresets,
  type HeroPreset,
} from "@/lib/hero";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  const session = await requireAuth([PERMISSIONS.banners]);
  if (!session) return unauthorizedJson();
  return NextResponse.json({ presets: getHeroPresets() });
}

export async function PUT(request: NextRequest) {
  const session = await requireAuth([PERMISSIONS.banners]);
  if (!session) return unauthorizedJson();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  const presets = (body as { presets?: unknown }).presets;
  if (
    !Array.isArray(presets) ||
    presets.length === 0 ||
    !presets.every(
      (p): p is HeroPreset =>
        !!p &&
        typeof p === "object" &&
        typeof (p as HeroPreset).id === "string" &&
        typeof (p as HeroPreset).name === "string" &&
        !!((p as HeroPreset).config) &&
        typeof (p as HeroPreset).config === "object" &&
        ["hero-text", "hero-center", "hero-glow"].includes(
          ((p as HeroPreset).config as { template?: unknown }).template as string
        )
    )
  ) {
    return NextResponse.json(
      { error: "Dữ liệu banner không hợp lệ" },
      { status: 400 }
    );
  }

  try {
    saveHeroPresets(presets);
    revalidatePath("/");
  } catch {
    return NextResponse.json(
      { error: "Không thể lưu cấu hình banner" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}