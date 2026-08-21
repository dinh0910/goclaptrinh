import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const post = db.select().from(posts).where(eq(posts.slug, slug)).get();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const existing = db.select().from(posts).where(eq(posts.slug, slug)).get();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const result = db
      .update(posts)
      .set({
        ...body,
        updatedAt: now,
      })
      .where(eq(posts.slug, slug))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existing = db.select().from(posts).where(eq(posts.slug, slug)).get();

    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    db.delete(posts).where(eq(posts.slug, slug)).run();

    return NextResponse.json({ message: "Post deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
