import Link from "next/link";
import { Category } from "@/lib/types";
import { DEFAULT_CATEGORY_ICON } from "@/lib/constants";

interface CategoryListProps {
  categories: Category[];
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  javascript: "from-yellow-400 to-orange-400",
  typescript: "from-blue-400 to-blue-600",
  react: "from-cyan-400 to-cyan-600",
  nextjs: "from-gray-400 to-gray-600",
  nodejs: "from-green-400 to-green-600",
  python: "from-sky-400 to-sky-600",
  devops: "from-purple-400 to-purple-600",
  "co-ban": "from-emerald-400 to-emerald-600",
};

const CATEGORY_BGS: Record<string, string> = {
  javascript: "bg-yellow-50 dark:bg-yellow-500/5",
  typescript: "bg-blue-50 dark:bg-blue-500/5",
  react: "bg-cyan-50 dark:bg-cyan-500/5",
  nextjs: "bg-gray-100 dark:bg-gray-200/5",
  nodejs: "bg-green-50 dark:bg-green-500/5",
  python: "bg-sky-50 dark:bg-sky-500/5",
  devops: "bg-purple-50 dark:bg-purple-500/5",
  "co-ban": "bg-emerald-50 dark:bg-emerald-500/5",
};

export default function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => {
        const slug = category.slug || category.name.toLowerCase();
        const icon = category.icon || DEFAULT_CATEGORY_ICON;
        const gradient = CATEGORY_GRADIENTS[slug] || "from-gray-400 to-gray-600";
        const bg = CATEGORY_BGS[slug] || "bg-gray-50 dark:bg-gray-500/5";

        return (
          <Link
            key={slug}
            href={`/categories/${slug}`}
            className={`group relative overflow-hidden rounded-xl ${bg} border border-gray-200/60 dark:border-gray-800 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300`}
          >
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />
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
