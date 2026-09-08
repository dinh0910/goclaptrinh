import { NextRequest, NextResponse } from "next/server";
import { getUsers, getUserByEmail, createUser } from "@/lib/users";
import { getRoles } from "@/lib/users";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  try {
    if (!(await requireAuth([PERMISSIONS.users]))) {
      return unauthorizedJson();
    }
    const roles = getRoles().map((r) => r.slug);
    const users = getUsers().map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      roleName: u.roleName,
      createdAt: u.createdAt,
    }));
    return NextResponse.json({ users, roles });
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách người dùng" },
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
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role : "viewer";

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mật khẩu và tên là bắt buộc" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    const validRoles = getRoles().map((r) => r.slug);
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Vai trò không hợp lệ: ${role}` },
        { status: 400 }
      );
    }

    const result = await createUser({ email, password, name, role });
    return NextResponse.json(
      {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        createdAt: result.createdAt,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo người dùng" },
      { status: 500 }
    );
  }
}