import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { cleanPostFields } from "@/lib/post-input";

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
    if (!(await requireAuth([PERMISSIONS.posts]))) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const cleaned = cleanPostFields(body);
    if (cleaned.error) {
      return NextResponse.json({ error: cleaned.error }, { status: 400 });
    }
    const v = cleaned.value;

    if (!v.slug || !v.title || !v.description || !v.date || !v.category || !v.content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = db.select().from(posts).where(eq(posts.slug, v.slug as string)).get();
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const result = db.insert(posts).values({
      slug: v.slug as string,
      title: v.title as string,
      description: v.description as string,
      date: v.date as string,
      category: v.category as string,
      tags: (v.tags as string[]) || [],
      author: (v.author as string) || "Góc Lập Trình",
      image: (v.image as string) || "",
      featured: (v.featured as boolean) || false,
      content: v.content as string,
      rawContent: (v.rawContent as string) || "",
      readingTime: (v.readingTime as string) || "5 phút đọc",
      createdAt: now,
      updatedAt: now,
    }).returning().get();

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
