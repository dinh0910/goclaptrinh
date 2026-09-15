import { getSeriesWithCounts } from "@/lib/series";
import SeriesManager from "@/components/admin/SeriesManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Quản lý series",
};

export default async function AdminSeriesPage() {
  if (!(await requireAuth([PERMISSIONS.posts]))) {
    notFound();
  }
  const series = getSeriesWithCounts({ includeUnpublished: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Series</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gom các bài viết thành chuỗi bài học, kèm điều hướng trước/sau ở trang bài viết.
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {series.length} series
        </span>
      </div>
      <SeriesManager initialSeries={series} />
    </div>
  );
}