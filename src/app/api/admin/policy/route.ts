import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { getPolicies, savePolicies } from "@/lib/policy";
import { getClientIp } from "@/lib/visitor";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import {
  isValidPolicySlug,
  MAX_POLICIES,
  MAX_POLICY_CONTENT_LENGTH,
  MAX_POLICY_SLUG_LENGTH,
  MAX_POLICY_SUMMARY_LENGTH,
  MAX_POLICY_TITLE_LENGTH,
  type PolicyDoc,
} from "@/lib/policy-config";

function clamp(text: unknown, max: number): string {
  return typeof text === "string" ? text.trim().slice(0, max) : "";
}

export async function GET() {
  const session = await requireAuth([PERMISSIONS.all]);
  if (!session) return unauthorizedJson();
  return NextResponse.json(getPolicies());
}

export async function PUT(request: Request) {
  const session = await requireAuth([PERMISSIONS.all]);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as { policies?: unknown } | null;
  if (!body || !Array.isArray(body.policies)) {
    return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  if (body.policies.length > MAX_POLICIES) {
    return NextResponse.json(
      { error: `Chỉ được có tối đa ${MAX_POLICIES} văn bản` },
      { status: 400 }
    );
  }

  const policies: PolicyDoc[] = [];
  const seen = new Set<string>();

  for (const raw of body.policies) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }
    const item = raw as Record<string, unknown>;

    const slug = clamp(item.slug, MAX_POLICY_SLUG_LENGTH).toLowerCase();
    if (!isValidPolicySlug(slug)) {
      return NextResponse.json(
        { error: `Slug "${clamp(item.slug, 60)}" không hợp lệ — chỉ dùng chữ thường, số và gạch nối` },
        { status: 400 }
      );
    }
    if (seen.has(slug)) {
      return NextResponse.json(
        { error: `Trùng slug "${slug}" — mỗi văn bản cần một slug riêng` },
        { status: 400 }
      );
    }
    seen.add(slug);

    const title = clamp(item.title, MAX_POLICY_TITLE_LENGTH);
    if (!title) {
      return NextResponse.json(
        { error: `Văn bản "${slug}" chưa có tiêu đề` },
        { status: 400 }
      );
    }

    policies.push({
      slug,
      title,
      summary: clamp(item.summary, MAX_POLICY_SUMMARY_LENGTH),
      content: clamp(item.content, MAX_POLICY_CONTENT_LENGTH),
      published: item.published === true,
      updatedAt: new Date().toISOString(),
    });
  }

  savePolicies(policies);

  // Nội dung nằm trong `settings` nên các trang public phải được làm mới tường minh.
  revalidatePath("/chinh-sach");
  revalidatePath("/chinh-sach/[slug]");
  revalidatePath("/sitemap.xml");

  logAudit({
    userId: session.user?.id,
    userEmail: session.user?.email ?? "",
    action: AUDIT_ACTIONS.policyUpdate,
    entity: "policy",
    detail: {
      slugs: policies.map((p) => p.slug),
      published: policies.filter((p) => p.published).length,
    },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(policies);
}
