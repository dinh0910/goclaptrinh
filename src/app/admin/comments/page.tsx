import CommentsManager from "@/components/admin/content/CommentsManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Bình luận",
};

export default async function AdminCommentsPage() {
  if (!(await requireAuth([PERMISSIONS.comments]))) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Bình luận" },
        ]}
      />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bình luận
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Quản lý bình luận từ người đọc. Bình luận của thành viên đã đăng nhập sẽ hiển thị ngay lập tức.
          </p>
        </div>
      </div>
      <CommentsManager />
    </div>
  );
}