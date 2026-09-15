import NewsletterManager from "@/components/admin/NewsletterManager";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Newsletter",
};

export default async function AdminNewsletterPage() {
  const session = await requireAuth([PERMISSIONS.newsletter]);
  if (!session) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Newsletter
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gửi bản tin qua Resend hoặc SendGrid cho danh sách người đăng ký
            (bao gồm email thu thập từ popup giới thiệu).
          </p>
        </div>
      </div>
      <NewsletterManager adminEmail={session.user?.email || ""} />
    </div>
  );
}