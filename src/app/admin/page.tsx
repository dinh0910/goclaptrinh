import { getAllPosts } from "@/lib/posts";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboard() {
  const posts = await getAllPosts();
  const categories = [...new Set(posts.map((p) => p.category))];
  const totalTags = [...new Set(posts.flatMap((p) => p.tags))];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng bài viết</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{posts.length}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Danh mục</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{categories.length}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Tags</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{totalTags.length}</p>
        </div>
        <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Featured</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {posts.filter((p) => p.featured).length}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bài viết gần đây</h2>
          <a href="/admin/posts/new" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            + Viết mới
          </a>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {posts.slice(0, 5).map((post) => (
            <div key={post.slug} className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{post.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {post.category} · {post.date} · {post.readingTime}
                </p>
              </div>
              <a
                href={`/admin/posts/${post.slug}/edit`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Sửa
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
