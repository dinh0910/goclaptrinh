import { notFound } from "next/navigation";
import WelcomeEditor from "@/components/admin/WelcomeEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export default async function AdminWelcomeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireAuth([PERMISSIONS.welcome]))) {
    notFound();
  }
  const { id } = await params;
  return <WelcomeEditor id={id} mode="edit" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: id === "new" ? "Popup giới thiệu mới" : `Chỉnh sửa popup: ${id}`,
  };
}