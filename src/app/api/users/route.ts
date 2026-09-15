import { NextRequest, NextResponse } from "next/server";
import { getUsers, getUserByEmail, createUser } from "@/lib/users";
import { getRoles } from "@/lib/users";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export async function GET() {
  try {
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
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
    const session = await requireAuth([PERMISSIONS.users]);
    if (!session) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? body.role : "viewer";

    if (!name) {
      return NextResponse.json(
        { field: "name", error: "Tên hiển thị là bắt buộc" },
        { status: 400 }
      );
    }
    if (!email) {
      return NextResponse.json(
        { field: "email", error: "Email là bắt buộc" },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { field: "email", error: "Email không đúng định dạng" },
        { status: 400 }
      );
    }
    if (!password) {
      return NextResponse.json(
        { field: "password", error: "Mật khẩu là bắt buộc" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { field: "password", error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }
    if (!role) {
      return NextResponse.json(
        { field: "role", error: "Vai trò là bắt buộc" },
        { status: 400 }
      );
    }

    const validRoles = getRoles().map((r) => r.slug);
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { field: "role", error: `Vai trò không hợp lệ: ${role}` },
        { status: 400 }
      );
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { field: "email", error: "Email đã tồn tại" },
        { status: 409 }
      );
    }

    const result = await createUser({ email, password, name, role });

    logAudit({
      action: AUDIT_ACTIONS.userCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "user",
      entityId: String(result.id),
      detail: { email: result.email, role },
      ip: getClientIp(request.headers),
    });

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