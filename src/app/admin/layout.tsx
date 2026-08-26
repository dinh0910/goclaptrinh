import { auth } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="fixed inset-0 z-50 flex bg-gray-50 dark:bg-gray-950">
      <AdminShell user={session?.user}>{children}</AdminShell>
    </div>
  );
}
