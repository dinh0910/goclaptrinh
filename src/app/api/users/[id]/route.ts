import { NextRequest, NextResponse } from "next/server";
import { updateUser, deleteUser } from "@/lib/users";
import { getRoles } from "@/lib/users";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    if (session.user?.id && Number(session.user.id) === userId) {
      return NextResponse.json(
        { error: "Không thể chỉnh sửa tài khoản đang đăng nhập" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email và tên là bắt buộc" },
        { status: 400 }
      );
    }
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }
    const validRoles = getRoles().map((r) => r.slug);
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Vai trò không hợp lệ: ${role}` },
        { status: 400 }
      );
    }

    const result = await updateUser(userId, { email, name, role, password });
    return NextResponse.json({
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      createdAt: result.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật người dùng" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
      return unauthorizedJson();
    }
    const { id } = await params;
    const userId = Number(id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
    }

    if (session.user?.id && Number(session.user.id) === userId) {
      return NextResponse.json(
        { error: "Không thể xóa tài khoản đang đăng nhập" },
        { status: 400 }
      );
    }

    const ok = deleteUser(userId);
    if (!ok) {
      return NextResponse.json({ error: "Người dùng không tồn tại" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa người dùng" },
      { status: 500 }
    );
  }
}