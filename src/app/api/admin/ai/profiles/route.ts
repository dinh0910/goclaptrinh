import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { getProviderById, listProfiles, saveProfiles } from "@/lib/llm";

function parseProviderId(value: string | null): number | null {
  if (!value) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    const searchParams = request.nextUrl.searchParams;
    const providerId = parseProviderId(searchParams.get("providerId"));
    if (!providerId || !getProviderById(providerId)) {
      return NextResponse.json({ error: "Nhà cung cấp không hợp lệ" }, { status: 400 });
    }
    return NextResponse.json({ profiles: listProfiles(providerId) });
  } catch {
    return NextResponse.json({ error: "Không thể tải cấu hình hành động" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const providerId = parseProviderId(
      typeof body.providerId === "number"
        ? String(body.providerId)
        : typeof body.providerId === "string"
          ? body.providerId
          : null
    );
    if (!providerId || !getProviderById(providerId)) {
      return NextResponse.json({ error: "Nhà cung cấp không hợp lệ" }, { status: 400 });
    }
    if (!Array.isArray(body.profiles)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const items = body.profiles.map((p: Record<string, unknown>) => {
      const action = typeof p.action === "string" ? p.action.trim() : "";
      const systemPrompt =
        typeof p.systemPrompt === "string" ? p.systemPrompt : undefined;
      const temperature =
        typeof p.temperature === "number" && Number.isFinite(p.temperature)
          ? Math.min(2, Math.max(0, p.temperature))
          : undefined;
      const maxTokens =
        typeof p.maxTokens === "number" && Number.isFinite(p.maxTokens)
          ? Math.min(32_000, Math.max(1, Math.floor(p.maxTokens)))
          : undefined;
      const enabled = typeof p.enabled === "boolean" ? p.enabled : undefined;
      return { action, systemPrompt, temperature, maxTokens, enabled };
    });

    const valid = items.filter((i: { action: string }) => i.action);
    if (valid.length === 0) {
      return NextResponse.json({ error: "Không có cấu hình hợp lệ" }, { status: 400 });
    }
    if (valid.length !== items.length) {
      return NextResponse.json({ error: "Có cấu hình thiếu action" }, { status: 400 });
    }

    saveProfiles(providerId, valid);
    return NextResponse.json({ ok: true, profiles: listProfiles(providerId) });
  } catch {
    return NextResponse.json({ error: "Không thể lưu cấu hình hành động" }, { status: 500 });
  }
}