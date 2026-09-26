import { notFound } from "next/navigation";
import PolicyManager from "@/components/admin/content/PolicyManager";
import Breadcrumb from "@/components/shared/Breadcrumb";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";

export const metadata = {
  title: "Chính sách",
};

export default async function AdminPolicyPage() {
  // Nội dung pháp lý chỉ nên do super-admin sửa — cùng cấp với tab "site" ở
  // /admin/settings, nên dùng PERMISSIONS.all thay vì thêm quyền mới.
  const session = await requireAuth([PERMISSIONS.all]);
  if (!session) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Chính sách" },
        ]}
      />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Chính sách
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Soạn và xuất bản các văn bản pháp lý hiển thị ở mục Chính sách trên
          website. Văn bản chưa xuất bản sẽ không ai xem được.
        </p>
      </div>
      <PolicyManager />
    </div>
  );
}
