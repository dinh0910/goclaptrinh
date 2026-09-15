import { auth } from "./auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "./db";
import { roles } from "./db/schema";

export const PERMISSIONS = {
  all: "all",
  posts: "posts",
  categories: "categories",
  media: "media",
  users: "users",
  banners: "banners",
  welcome: "welcome",
  newsletter: "newsletter",
  analytics: "analytics",
  comments: "comments",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const VALID_PERMISSIONS = Object.values(PERMISSIONS);

export const ADMIN_PERMISSIONS: Permission[] = [
  PERMISSIONS.posts,
  PERMISSIONS.categories,
  PERMISSIONS.media,
  PERMISSIONS.users,
  PERMISSIONS.banners,
  PERMISSIONS.welcome,
  PERMISSIONS.newsletter,
  PERMISSIONS.analytics,
  PERMISSIONS.comments,
];

export function getRolePermissions(role?: string | null): string[] {
  if (!role) return [];
  const row = db.select().from(roles).where(eq(roles.slug, role)).get();
  return Array.isArray(row?.permissions) ? (row.permissions as string[]) : [];
}

export function hasPermission(
  rolePerms: string[],
  permission: Permission
): boolean {
  return rolePerms.includes(PERMISSIONS.all) || rolePerms.includes(permission);
}

export function hasAnyPermission(perms: string[]): boolean {
  return getEffectivePermissions(perms).length > 0;
}

export function getEffectivePermissions(
  raw: string | string[] | null | undefined
): Permission[] {
  const rolePerms = Array.isArray(raw) ? raw : getRolePermissions(raw);
  const set = new Set<string>();
  if (rolePerms.includes(PERMISSIONS.all)) {
    for (const p of ADMIN_PERMISSIONS) set.add(p);
  }
  for (const p of rolePerms) {
    if ((ADMIN_PERMISSIONS as string[]).includes(p)) set.add(p);
  }
  return Array.from(set) as Permission[];
}

export function hasAnyEffectivePermission(
  raw: string | string[] | null | undefined
): boolean {
  return getEffectivePermissions(raw).length > 0;
}

export interface RequireResult {
  ok: boolean;
  status: number;
  error: string;
}

const UNAUTHORIZED: RequireResult = {
  ok: false,
  status: 401,
  error: "Không có quyền truy cập",
};

/**
 * Server helper dành cho API routes.
 * Trả về session nếu người dùng có ít nhất một trong các quyền trong `permissions`.
 * Nếu `permissions` rỗng -> chỉ cần đã đăng nhập.
 */
export async function requireAuth(permissions: Permission[] = []) {
  const session = await auth();
  if (!session) return null;
  const perms = getRolePermissions(session.user?.role);
  if (!hasAnyEffectivePermission(perms)) return null;
  if (permissions.length === 0) return session;
  if (
    permissions.some((p) => hasPermission(perms, p))
  ) {
    return session;
  }
  return null;
}

export function unauthorizedJson() {
  return NextResponse.json(UNAUTHORIZED, { status: 401 });
}