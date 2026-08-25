import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import PostActions from "@/components/admin/PostActions";

export const metadata = {
  title: "Quản lý bài viết",
};

export default async function AdminPostsPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bài viết</h1>
        <Link
          href="/admin/posts/new"
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Viết mới
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tiêu đề</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Danh mục</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ngày</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {posts.map((post) => (
              <tr key={post.slug} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="p-4">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.title}</p>
                  {post.featured && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded dark:text-amber-400 dark:bg-amber-500/10">
                      Featured
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{post.category}</span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{post.date}</span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                        {tag}
                      </span>
                    ))}
                    {post.tags.length > 2 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-gray-400 dark:text-gray-500">
                        +{post.tags.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <PostActions slug={post.slug} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
