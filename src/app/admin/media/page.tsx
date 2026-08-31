import MediaManager from "@/components/admin/MediaManager";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quản lý hình ảnh",
};

export default async function AdminMediaPage() {
  const items = db.select().from(media).orderBy(desc(media.createdAt)).all();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hình ảnh
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Thư viện media & SEO hình ảnh
        </span>
      </div>
      <MediaManager initialItems={items} />
    </div>
  );
}