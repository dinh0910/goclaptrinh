import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import PostTable from "@/components/admin/PostTable";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";

export const metadata = {
  title: "Quản lý bài viết",
};

export default async function AdminPostsPage() {
  const posts = await getAllPosts();
  const categoryList = db.select().from(categories).all();
  const categoryName = Object.fromEntries(
    categoryList.map((c) => [c.slug, c.name])
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bài viết
        </h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Viết mới
        </Link>
      </div>

      <PostTable posts={posts} categoryName={categoryName} />
    </div>
  );
}
