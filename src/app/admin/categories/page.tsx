import { getCategoriesWithCounts } from "@/lib/categories";
import CategoryManager from "@/components/admin/content/CategoryManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Quản lý danh mục",
};

export default async function AdminCategoriesPage() {
  if (!(await requireAuth([PERMISSIONS.categories]))) {
    notFound();
  }
  const categories = getCategoriesWithCounts({ includeUnpublished: true });

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Danh mục" },
        ]}
      />
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