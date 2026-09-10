import { notFound } from "next/navigation";
import BannerEditor from "@/components/admin/BannerEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { getHeroPresets } from "@/lib/hero";

export default async function AdminBannerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await requireAuth([PERMISSIONS.banners]))) {
    notFound();
  }
  const { id } = await params;
  return <BannerEditor id={id} mode="edit" />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const preset = getHeroPresets().find((p) => p.id === id);
  return {
    title: preset ? `Chỉnh sửa biến thể: ${preset.name}` : "Chỉnh sửa biến thể",
  };
}