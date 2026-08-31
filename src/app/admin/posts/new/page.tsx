import { getCategoriesWithCounts } from "@/lib/categories";
import PostEditor from "@/components/admin/PostEditor";

export const metadata = {
  title: "Viết bài mới",
};

export default function NewPostPage() {
  const categories = getCategoriesWithCounts();

  return (
    <PostEditor mode="create" categories={categories} />
  );
}
