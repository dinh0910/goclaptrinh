import { notFound } from "next/navigation";
import WelcomeEditor from "@/components/admin/WelcomeEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Popup giới thiệu mới",
};

export default async function AdminWelcomeNewPage() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) {
    notFound();
  }

  return <WelcomeEditor id="new" mode="new" />;
}