import { NextRequest, NextResponse } from "next/server";
import {
  getUsers,
  updateUserPassword,
} from "@/lib/users";
import {
  requireAuth,
  unauthorizedJson,
  PERMISSIONS,
} from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth([PERMISSIONS.users]);
  if (!session) {
    return unauthorizedJson();
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
  }

  const user = getUsers().find((u) => u.id === userId);
  if (!user) {
    return NextResponse.json(
      { error: "Người dùng không tồn tại" },
      { status: 404 }
    );
  }

  // Chỉ tài khoản quản trị mới được đặt lại mật khẩu của quản trị viên khác.
  if (user.role === "admin" && session.user?.role !== "admin") {
    return unauthorizedJson();
  }

  const body = (await request.json()) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password : "";

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Mật khẩu phải có ít nhất 6 ký tự" },
      { status: 400 }
    );
  }

  const ok = await updateUserPassword(userId, password);
  if (!ok) {
    return NextResponse.json(
      { error: "Không thể cập nhật mật khẩu" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}