import Link from "next/link";
import { Category } from "@/lib/types";
import { DEFAULT_CATEGORY_ICON } from "@/lib/constants";
import { categoryColor } from "@/lib/categoryColors";

interface CategoryListProps {
  categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => {
        const slug = category.slug || category.name.toLowerCase();
        const icon = category.icon || DEFAULT_CATEGORY_ICON;
        const color = categoryColor(category.color || slug);

        return (
          <Link
            key={slug}
            href={`/categories/${slug}`}
            className={`group relative overflow-hidden rounded-xl ${color.bg} ${color.darkBg} border border-gray-200/60 dark:border-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${color.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{icon}</span>
                {category.count > 0 && (
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {category.count}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {category.name}
              </h3>
              {category.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
