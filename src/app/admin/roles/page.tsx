import { getRolesWithCounts } from "@/lib/users";
import RoleManager from "@/components/admin/RoleManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Quản lý vai trò",
};

export default async function AdminRolesPage() {
  if (!(await requireAuth([PERMISSIONS.users]))) {
    notFound();
  }

  const roles = getRolesWithCounts().map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    count: r.count,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Vai trò
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {roles.length} vai trò
        </span>
      </div>
      <RoleManager initialRoles={roles} />
    </div>
  );
}