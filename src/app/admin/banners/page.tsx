import { notFound } from "next/navigation";
import BannerList from "@/components/admin/BannerList";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Quản lý banner",
};

export default async function AdminBannersPage() {
  const session = await requireAuth([PERMISSIONS.banners]);
  if (!session) {
    notFound();
  }

  return <BannerList />;
}