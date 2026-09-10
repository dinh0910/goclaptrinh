import { notFound } from "next/navigation";
import BannerEditor from "@/components/admin/BannerEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Thêm biến thể mới",
};

export default async function AdminBannerNewPage() {
  if (!(await requireAuth([PERMISSIONS.banners]))) {
    notFound();
  }
  return <BannerEditor mode="new" />;
}