import { notFound } from "next/navigation";
import ChatInbox from "@/components/admin/chat/ChatInbox";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Tin nhắn",
};

export default async function AdminChatPage() {
  if (!(await requireAuth([PERMISSIONS.chat]))) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Tin nhắn" },
        ]}
      />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tin nhắn</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Trả lời khách từ khung chat trên website. Khách không cần đăng nhập vẫn liên hệ được.
        </p>
      </div>
      <ChatInbox />
    </div>
  );
}
