import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";
import { updateRole, deleteRole, getRolesWithCounts, getUsers } from "@/lib/users";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAuth([PERMISSIONS.users]))) {
      return unauthorizedJson();
    }
    const { id } = await params;
    const roleId = Number(id);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const body = await request.json();
    const slug = slugify(body.slug);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p: unknown) => typeof p === "string")
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

    const duplicate = getRolesWithCounts().find(
      (r) => r.slug === slug && r.id !== roleId
    );
    if (duplicate) {
      return NextResponse.json(
        { field: "slug", error: "Slug vai trò đã tồn tại" },
        { status: 409 }
      );
    }

    const result = await updateRole(roleId, {
      slug,
      name,
      description,
      permissions,
    });
    const count = getUsers().filter((u) => u.role === result.slug).length;
    return NextResponse.json({ ...result, count });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật vai trò" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await requireAuth([PERMISSIONS.users]))) {
      return unauthorizedJson();
    }
    const { id } = await params;
    const roleId = Number(id);
    if (!Number.isInteger(roleId) || roleId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    const current = getRolesWithCounts().find((r) => r.id === roleId);
    if (!current) {
      return NextResponse.json({ error: "Vai trò không tồn tại" }, { status: 404 });
    }
    if (current.count > 0) {
      return NextResponse.json(
        { error: `Không thể xóa vai trò "${current.name}" vì còn ${current.count} người dùng. Hãy chuyển vai trò trước.` },
        { status: 400 }
      );
    }
    // Protect the built-in admin role from deletion.
    if (current.slug === "admin") {
      return NextResponse.json(
        { error: "Không thể xóa vai trò Quản trị viên" },
        { status: 400 }
      );
    }

    const ok = deleteRole(roleId);
    if (!ok) {
      return NextResponse.json({ error: "Vai trò không tồn tại" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa vai trò" },
      { status: 500 }
    );
  }
}