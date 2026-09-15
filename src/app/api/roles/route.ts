import { NextRequest, NextResponse } from "next/server";
import { getRolesWithCounts, createRole } from "@/lib/users";
import { slugify } from "@/lib/utils";
import { requireAuth, unauthorizedJson, PERMISSIONS, VALID_PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export async function GET() {
  try {
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
      return unauthorizedJson();
    }
    return NextResponse.json(getRolesWithCounts());
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách vai trò" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const slug = slugify(typeof body.slug === "string" ? body.slug : "");
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const allowedPerms = new Set<string>(VALID_PERMISSIONS);
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p: unknown) => typeof p === "string" && allowedPerms.has(p))
      : [];

    if (!slug) {
      return NextResponse.json(
        { field: "slug", error: "Slug vai trò là bắt buộc" },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { field: "name", error: "Tên vai trò là bắt buộc" },
        { status: 400 }
      );
    }

    const existing = getRolesWithCounts().find((r) => r.slug === slug);
    if (existing) {
      return NextResponse.json(
        { field: "slug", error: "Slug vai trò đã tồn tại" },
        { status: 409 }
      );
    }

    const result = createRole({ slug, name, description, permissions });

    logAudit({
      action: AUDIT_ACTIONS.roleCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "role",
      entityId: slug,
      detail: { name, permissions },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(
      { ...result, count: 0 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo vai trò" },
      { status: 500 }
    );
  }
}