import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import {
  callLlm,
  fetchLlmModels,
  getActiveProvider,
  getProfile,
  listProfiles,
  listProviders,
  toPublicProvider,
  type ProviderInput,
} from "@/lib/llm";
import { DEFAULT_AI_PROFILES } from "@/lib/ai-defaults";
import { sanitizePostHtml } from "@/lib/sanitize";

function extractText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function providerFromActive(): ProviderInput | null {
  const active = getActiveProvider();
  if (!active) return null;
  return { baseUrl: active.base_url, apiKey: active.api_key, model: active.model };
}

// Build a provider config that prefers unsaved form values (used by the
// "Kiểm tra" and "Lấy danh sách Model" buttons before saving).
function providerFromBody(
  body: Record<string, unknown>,
  active: ProviderInput | null
): ProviderInput | null {
  const unsavedBaseUrl =
    typeof body.baseUrl === "string" && body.baseUrl.trim() ? body.baseUrl.trim() : "";
  const unsavedApiKey =
    typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey.trim() : "";
  const model = typeof body.model === "string" && body.model.trim() ? body.model.trim() : "";
  if (unsavedBaseUrl || unsavedApiKey) {
    return {
      baseUrl: unsavedBaseUrl || active?.baseUrl || "",
      apiKey: unsavedApiKey || active?.apiKey || "",
      model: model || active?.model || "",
    };
  }
  return active;
}

export async function GET() {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();
    return NextResponse.json({
      providers: listProviders().map((p) => ({
        ...toPublicProvider(p),
        profiles: listProfiles(p.id),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Không thể tải cấu hình AI" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) return unauthorizedJson();

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "test") {
      const active = getActiveProvider();
      const profile =
        (active ? getProfile(active.id, "test") : null) ??
        DEFAULT_AI_PROFILES.find((p) => p.action === "test");
      const provider = providerFromBody(body, providerFromActive());
      if (!provider) {
        return NextResponse.json(
          { error: "Chưa kích hoạt nhà cung cấp AI nào trong Cài đặt" },
          { status: 400 }
        );
      }
      const result = await callLlm(
        {
          system: profile?.systemPrompt || "Bạn chỉ trả lời bằng hai chữ: OK CHAT.",
          user: "Kết nối thử",
          maxTokens: profile?.maxTokens ?? 16,
          temperature: profile?.temperature ?? 0,
        },
        provider
      );
      return NextResponse.json({ ok: true, result });
    }

    if (action === "list_models") {
      const provider = providerFromBody(body, providerFromActive());
      if (!provider) {
        return NextResponse.json(
          { error: "Chưa kích hoạt nhà cung cấp AI nào trong Cài đặt" },
          { status: 400 }
        );
      }
      const models = await fetchLlmModels({
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
      });
      return NextResponse.json({ ok: true, models });
    }

    const active = getActiveProvider();
    if (!active) {
      return NextResponse.json(
        { error: "Chưa kích hoạt nhà cung cấp AI nào. Vào Cài đặt → AI để kích hoạt." },
        { status: 400 }
      );
    }
    const provider: ProviderInput = {
      baseUrl: active.base_url,
      apiKey: active.api_key,
      model: active.model,
    };

    if (action === "generate") {
      const profile = getProfile(active.id, "generate");
      if (!profile) {
        return NextResponse.json({ error: "Không tìm thấy cấu hình hành động tạo nháp" }, { status: 500 });
      }
      if (!profile.enabled) {
        return NextResponse.json({ error: "Hành động \"Viết nháp\" đã bị tắt trong Cài đặt AI" }, { status: 400 });
      }
      const title = typeof body.title === "string" ? body.title.trim() : "";
      if (!title) {
        return NextResponse.json({ error: "Thiếu tiêu đề bài viết" }, { status: 400 });
      }
      const category = typeof body.category === "string" ? body.category.trim() : "";
      const tags = Array.isArray(body.tags)
        ? body.tags.filter((t: unknown): t is string => typeof t === "string").join(", ")
        : "";
      const user = [
        `Tiêu đề bài viết: ${title}`,
        category ? `Danh mục: ${category}` : "",
        tags ? `Tags: ${tags}` : "",
        "Độ dài: khoảng 800–1500 từ, chi tiết, có ví dụ code minh họa, kết luận rõ ràng.",
      ]
        .filter(Boolean)
        .join("\n");
      const result = await callLlm(
        {
          system: profile.systemPrompt,
          user,
          maxTokens: profile.maxTokens,
          temperature: profile.temperature,
        },
        provider
      );
      const safe = sanitizePostHtml(result);
      if (!safe) {
        return NextResponse.json({ error: "Kết quả AI không hợp lệ" }, { status: 502 });
      }
      return NextResponse.json({ result: safe });
    }

    const content = typeof body.content === "string" ? body.content : "";
    const text = extractText(content);
    if (!text) {
      return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });
    }

    if (action === "summarize") {
      const profile = getProfile(active.id, "summarize");
      if (!profile) {
        return NextResponse.json({ error: "Không tìm thấy cấu hình hành động tóm tắt" }, { status: 500 });
      }
      if (!profile.enabled) {
        return NextResponse.json({ error: "Hành động \"Tóm tắt\" đã bị tắt trong Cài đặt AI" }, { status: 400 });
      }
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const result = await callLlm(
        {
          system: profile.systemPrompt,
          user: title
            ? `Tiêu đề: ${title}\n\nNội dung:\n${text.slice(0, 20_000)}`
            : `Nội dung:\n${text.slice(0, 20_000)}`,
          maxTokens: profile.maxTokens,
          temperature: profile.temperature,
        },
        provider
      );
      const cleaned = result.replace(/^["']|["']$/g, "");
      return NextResponse.json({ result: cleaned.slice(0, 200) });
    }

    if (action === "proofread") {
      const profile = getProfile(active.id, "proofread");
      if (!profile) {
        return NextResponse.json({ error: "Không tìm thấy cấu hình hành động sửa chính tả" }, { status: 500 });
      }
      if (!profile.enabled) {
        return NextResponse.json({ error: "Hành động \"Sửa chính tả\" đã bị tắt trong Cài đặt AI" }, { status: 400 });
      }
      const result = await callLlm(
        {
          system: profile.systemPrompt,
          user: `Nội dung (HTML):\n${content.slice(0, 40_000)}`,
          maxTokens: profile.maxTokens,
          temperature: profile.temperature,
        },
        provider
      );
      const safe = sanitizePostHtml(result);
      if (!safe) {
        return NextResponse.json({ error: "Kết quả AI không hợp lệ" }, { status: 502 });
      }
      return NextResponse.json({ result: safe });
    }

    return NextResponse.json({ error: "Hành động không hỗ trợ" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lỗi AI";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}