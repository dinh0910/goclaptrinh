import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";
import { getEffectivePermissions } from "@/lib/permissions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const permissions = getEffectivePermissions(session?.user?.role);

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50 dark:bg-gray-950">
      <AdminShell user={session?.user} permissions={permissions}>
        {children}
      </AdminShell>
    </div>
  );
}