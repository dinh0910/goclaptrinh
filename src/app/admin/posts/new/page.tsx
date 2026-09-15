import { getCategoriesWithCounts } from "@/lib/categories";
import { getAllSeriesSimple } from "@/lib/series";
import PostEditor from "@/components/admin/PostEditor";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Viết bài mới",
};

export default async function NewPostPage() {
  if (!(await requireAuth([PERMISSIONS.posts]))) {
    notFound();
  }
  const categories = getCategoriesWithCounts({ includeUnpublished: true });
  const seriesList = getAllSeriesSimple();

  return (
    <PostEditor mode="create" categories={categories} seriesList={seriesList} />
  );
}
