import { getCategoriesWithCounts } from "@/lib/categories";
import CategoryManager from "@/components/admin/CategoryManager";

export const metadata = {
  title: "Quản lý danh mục",
};

export default async function AdminCategoriesPage() {
  const categories = getCategoriesWithCounts();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {categories.length} danh mục
        </span>
      </div>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}