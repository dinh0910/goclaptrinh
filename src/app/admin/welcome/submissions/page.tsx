import { notFound } from "next/navigation";
import WelcomeSubmissions from "@/components/admin/content/WelcomeSubmissions";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Đăng ký nhận tin",
};

export default async function AdminWelcomeSubmissionsPage() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) {
    notFound();
  }

  return <WelcomeSubmissions />;
}