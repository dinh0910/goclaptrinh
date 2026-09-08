import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, roles } from "./db/schema";
import type { UserRow, RoleRow } from "./db/schema";

export interface UserWithRole extends UserRow {
  roleName: string;
}

export interface RoleWithCount extends RoleRow {
  count: number;
}

export function getUsers(): UserWithRole[] {
  const allRoles = db.select().from(roles).all();
  const roleByName = new Map(allRoles.map((r) => [r.slug, r.name]));
  return db
    .select()
    .from(users)
    .orderBy(users.id)
    .all()
    .map((u) => ({
      ...u,
      roleName: roleByName.get(u.role) || u.role,
    }));
}

export function getUserByEmail(email: string): UserRow | undefined {
  return db.select().from(users).where(eq(users.email, email)).get();
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<UserRow> {
  const password = await bcrypt.hash(data.password, 12);
  return db
    .insert(users)
    .values({
      email: data.email,
      password,
      name: data.name,
      role: data.role || "viewer",
    })
    .returning()
    .get();
}

export async function updateUser(
  id: number,
  data: {
    email: string;
    name: string;
    role: string;
    password?: string;
  }
): Promise<UserRow> {
  const values: Partial<typeof users.$inferInsert> = {
    email: data.email,
    name: data.name,
    role: data.role,
  };
  if (data.password) {
    values.password = await bcrypt.hash(data.password, 12);
  }
  return db.update(users).set(values).where(eq(users.id, id)).returning().get();
}

export function deleteUser(id: number): boolean {
  return db.delete(users).where(eq(users.id, id)).run().changes > 0;
}

export async function updateUserPassword(
  id: number,
  password: string
): Promise<boolean> {
  const hash = await bcrypt.hash(password, 12);
  return (
    db.update(users).set({ password: hash }).where(eq(users.id, id)).run()
      .changes > 0
  );
}

export function getRoles(): RoleRow[] {
  return db.select().from(roles).orderBy(roles.id).all();
}

export function getRolesWithCounts(): RoleWithCount[] {
  return db
    .select({
      id: roles.id,
      slug: roles.slug,
      name: roles.name,
      description: roles.description,
      permissions: roles.permissions,
      createdAt: roles.createdAt,
      count: db.$count(users, eq(users.role, roles.slug)),
    })
    .from(roles)
    .orderBy(roles.id)
    .all() as RoleWithCount[];
}

export function createRole(data: {
  slug: string;
  name: string;
  description: string;
  permissions: string[];
}): RoleRow {
  return db
    .insert(roles)
    .values({
      slug: data.slug,
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    })
    .returning()
    .get();
}

export function updateRole(
  id: number,
  data: {
    slug: string;
    name: string;
    description: string;
    permissions: string[];
  }
): RoleRow {
  return db
    .update(roles)
    .set({
      slug: data.slug,
      name: data.name,
      description: data.description,
      permissions: data.permissions,
    })
    .where(eq(roles.id, id))
    .returning()
    .get();
}

export function deleteRole(id: number): boolean {
  return db.delete(roles).where(eq(roles.id, id)).run().changes > 0;
}