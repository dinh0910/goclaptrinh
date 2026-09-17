import { getAllPosts } from "@/lib/posts";
import PostTable from "@/components/admin/content/PostTable";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { requireAuth, PERMISSIONS } from "@/lib/permissions";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/shared/Breadcrumb";

export const metadata = {
  title: "Quản lý bài viết",
};

export default async function AdminPostsPage() {
  if (!(await requireAuth([PERMISSIONS.posts]))) {
    notFound();
  }
  const posts = await getAllPosts({ includeUnpublished: true });
  const categoryList = db.select().from(categories).all();
  const categoryName = Object.fromEntries(
    categoryList.map((c) => [c.slug, c.name])
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Bài viết" },
        ]}
      />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Bài viết
      </h1>

      <PostTable posts={posts} categoryName={categoryName} />
    </div>
  );
}
