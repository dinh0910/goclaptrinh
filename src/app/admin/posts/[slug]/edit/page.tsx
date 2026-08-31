import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCategoriesWithCounts } from "@/lib/categories";
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

  const categories = getCategoriesWithCounts();

  return (
    <PostEditor
      mode="edit"
      slug={post.slug}
      categories={categories}
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
  );
}
