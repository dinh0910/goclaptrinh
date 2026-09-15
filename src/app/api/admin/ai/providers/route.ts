import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { createProvider, getProviderById, toPublicProvider } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model = typeof body.model === "string" ? body.model.trim() : "";
    const active = body.active === true;

    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Tên nhà cung cấp không hợp lệ (1–60 ký tự)" }, { status: 400 });
    }
    if (!baseUrl || baseUrl.length > 300) {
      return NextResponse.json({ error: "Base URL không hợp lệ" }, { status: 400 });
    }
    if (!/^https?:\/\//i.test(baseUrl)) {
      return NextResponse.json({ error: "Base URL phải bắt đầu bằng http:// hoặc https://" }, { status: 400 });
    }
    if (model.length > 100) {
      return NextResponse.json({ error: "Model không hợp lệ" }, { status: 400 });
    }

    const id = createProvider({ name, baseUrl, apiKey, model, active });
    const provider = getProviderById(id);
    return NextResponse.json({ ok: true, provider: provider ? toPublicProvider(provider) : null });
  } catch {
    return NextResponse.json({ error: "Không thể tạo nhà cung cấp AI" }, { status: 500 });
  }
}