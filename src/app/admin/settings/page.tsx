import { requireAuth, getEffectivePermissions, getRolePermissions, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import AdminSettingsPage from "@/components/admin/AdminSettingsPage";

export const metadata = {
  title: "Cài đặt",
};

export default async function SettingsPage() {
  if (!(await requireAuth([]))) {
    notFound();
  }
  const session = await requireAuth();
  const permissions = getEffectivePermissions(session?.user?.role);
  const canManageAi =
    permissions.includes(PERMISSIONS.posts) ||
    permissions.includes(PERMISSIONS.all);
  const canManageSite = getRolePermissions(session?.user?.role).includes(
    PERMISSIONS.all
  );

  return <AdminSettingsPage canManageAi={canManageAi} canManageSite={canManageSite} />;
}