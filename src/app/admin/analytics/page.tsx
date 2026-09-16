import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Thống kê truy cập",
};

export default async function AdminAnalyticsPage() {
  if (!(await requireAuth([PERMISSIONS.analytics]))) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Thống kê truy cập" },
        ]}
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thống kê truy cập
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Lượt xem, khách truy cập, thiết bị, bài được đọc nhiều nhất và tỷ lệ
            đăng ký từ popup giới thiệu.
          </p>
        </div>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}