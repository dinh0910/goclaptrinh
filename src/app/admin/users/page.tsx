import { notFound } from "next/navigation";
import { getUsers, getRoles } from "@/lib/users";
import UserManager from "@/components/admin/UserManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Quản lý người dùng",
};

export default async function AdminUsersPage() {
  const session = await requireAuth([PERMISSIONS.users]);
  if (!session) {
    notFound();
  }

  const userRows = getUsers();
  const roleSlugs = getRoles().map((r) => r.slug);

  const users = userRows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    roleName: u.roleName,
    createdAt: u.createdAt,
  }));
  const currentUserId = Number(session.user?.id) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Người dùng
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {users.length} người dùng
        </span>
      </div>
      <UserManager
        initialUsers={users}
        roles={roleSlugs}
        currentUserId={currentUserId}
      />
    </div>
  );
}