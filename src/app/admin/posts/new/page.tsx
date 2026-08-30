import { getCategoriesWithCounts } from "@/lib/categories";
import PostEditor from "@/components/admin/PostEditor";

export const metadata = {
  title: "Viết bài mới",
};

export default function NewPostPage() {
  const categories = getCategoriesWithCounts();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Viết bài mới
      </h1>
      <PostEditor mode="create" categories={categories} />
    </div>
  );
}
