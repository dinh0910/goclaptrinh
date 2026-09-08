import { NextRequest, NextResponse } from "next/server";
import { getRolesWithCounts, createRole } from "@/lib/users";
import { slugify } from "@/lib/utils";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  try {
    if (!(await requireAuth([PERMISSIONS.users]))) {
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
    if (!(await requireAuth([PERMISSIONS.users]))) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const slug = slugify(typeof body.slug === "string" ? body.slug : "");
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p: unknown) => typeof p === "string")
      : [];

    if (!slug || !name) {
      return NextResponse.json(
        { error: "Tên và slug vai trò là bắt buộc" },
        { status: 400 }
      );
    }

    const existing = getRolesWithCounts().find((r) => r.slug === slug);
    if (existing) {
      return NextResponse.json(
        { error: "Slug vai trò đã tồn tại" },
        { status: 409 }
      );
    }

    const result = createRole({ slug, name, description, permissions });
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