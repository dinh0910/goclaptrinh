import { notFound } from "next/navigation";
import WelcomeList from "@/components/admin/content/WelcomeList";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Popup giới thiệu",
};

export default async function AdminWelcomePage() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) {
    notFound();
  }

  return <WelcomeList />;
}