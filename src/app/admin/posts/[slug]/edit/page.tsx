import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import PostEditor from "@/components/admin/PostEditor";

export const metadata = {
  title: "Chỉnh sửa bài viết",
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = db.select().from(posts).where(eq(posts.slug, slug)).get();

  if (!post) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Chỉnh sửa: {post.title}
      </h1>
      <PostEditor
        mode="edit"
        slug={post.slug}
        initialData={{
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          category: post.category,
          tags: post.tags || [],
          author: post.author,
          image: post.image || "",
          featured: post.featured,
          content: post.content,
          readingTime: post.readingTime,
        }}
      />
    </div>
  );
}
