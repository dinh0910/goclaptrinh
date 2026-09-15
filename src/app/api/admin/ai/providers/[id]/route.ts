import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import {
  callLlm,
  deleteProvider,
  fetchLlmModels,
  getProfile,
  getProviderById,
  listProviders,
  toPublicProvider,
  updateProvider,
} from "@/lib/llm";

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const provider = getProviderById(id);
    if (!provider) {
      return NextResponse.json({ error: "Không tìm thấy nhà cung cấp" }, { status: 404 });
    }
    return NextResponse.json({ provider: toPublicProvider(provider) });
  } catch {
    return NextResponse.json({ error: "Không thể tải nhà cung cấp" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const existing = getProviderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy nhà cung cấp" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : undefined;
    const apiKey = body.apiKey === null ? null : typeof body.apiKey === "string" ? body.apiKey : undefined;
    const model = typeof body.model === "string" ? body.model.trim() : undefined;
    const active = body.active;

    if (name !== undefined && (!name || name.length > 60)) {
      return NextResponse.json({ error: "Tên nhà cung cấp không hợp lệ (1–60 ký tự)" }, { status: 400 });
    }
    if (baseUrl !== undefined) {
      if (!baseUrl || baseUrl.length > 300) {
        return NextResponse.json({ error: "Base URL không hợp lệ" }, { status: 400 });
      }
      if (!/^https?:\/\//i.test(baseUrl)) {
        return NextResponse.json({ error: "Base URL phải bắt đầu bằng http:// hoặc https://" }, { status: 400 });
      }
    }
    if (model !== undefined && model.length > 100) {
      return NextResponse.json({ error: "Model không hợp lệ" }, { status: 400 });
    }

    const provider = updateProvider(id, {
      name,
      baseUrl,
      apiKey,
      model,
      active: typeof active === "boolean" ? active : undefined,
    });
    return NextResponse.json({ ok: true, provider: provider ? toPublicProvider(provider) : null });
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật nhà cung cấp AI" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const provider = getProviderById(id);
    if (!provider) {
      return NextResponse.json({ error: "Không tìm thấy nhà cung cấp" }, { status: 404 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const draftBaseUrl =
      typeof body.baseUrl === "string" && body.baseUrl.trim()
        ? body.baseUrl.trim()
        : "";
    const draftApiKey =
      typeof body.apiKey === "string" && body.apiKey.trim()
        ? body.apiKey.trim()
        : "";
    const draftModel =
      typeof body.model === "string" && body.model.trim()
        ? body.model.trim()
        : "";
    const cfg = {
      baseUrl: draftBaseUrl || provider.base_url,
      apiKey: draftApiKey || provider.api_key,
      model: draftModel || provider.model,
    };

    if (action === "test") {
      const profile = getProfile("test");
      const result = await callLlm(
        {
          system: profile?.systemPrompt || "Bạn chỉ trả lời bằng hai chữ: OK CHAT.",
          user: "Kết nối thử",
          maxTokens: profile?.maxTokens ?? 16,
          temperature: profile?.temperature ?? 0,
        },
        cfg
      );
      return NextResponse.json({ ok: true, result });
    }

    if (action === "list_models") {
      const models = await fetchLlmModels(cfg);
      return NextResponse.json({ ok: true, models });
    }

    return NextResponse.json({ error: "Hành động không hỗ trợ" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Không thể thực hiện hành động" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    const { id: rawId } = await params;
    const id = parseId(rawId);
    if (!id) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }
    const provider = getProviderById(id);
    if (!provider) {
      return NextResponse.json({ error: "Không tìm thấy nhà cung cấp" }, { status: 404 });
    }
    deleteProvider(id);
    return NextResponse.json({ ok: true, remaining: listProviders().map(toPublicProvider) });
  } catch {
    return NextResponse.json({ error: "Không thể xóa nhà cung cấp AI" }, { status: 500 });
  }
}