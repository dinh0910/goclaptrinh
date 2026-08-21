import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export async function GET() {
  try {
    const allPosts = db.select().from(posts).all();
    return NextResponse.json(allPosts);
  } catch {
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, description, date, category, tags, author, image, featured, content, readingTime } = body;

    if (!slug || !title || !description || !date || !category || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = db.select().from(posts).where(eq(posts.slug, slug)).get();
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const result = db.insert(posts).values({
      slug,
      title,
      description,
      date,
      category,
      tags: tags || [],
      author: author || "Góc Lập Trình",
      image: image || "",
      featured: featured || false,
      content,
      readingTime: readingTime || "5 phút đọc",
      createdAt: now,
      updatedAt: now,
    }).returning().get();

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
