import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { cleanPostFields } from "@/lib/post-input";

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
    if (!(await requireAuth([PERMISSIONS.posts]))) {
      return unauthorizedJson();
    }
    const { slug } = await params;
    const body = await request.json();
    const cleaned = cleanPostFields(body, true);
    if (cleaned.error) {
      return NextResponse.json({ error: cleaned.error }, { status: 400 });
    }
    const v = cleaned.value;

    const existing = db.select().from(posts).where(eq(posts.slug, slug)).get();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (v.slug !== undefined && v.slug !== existing.slug) {
      const dup = db.select().from(posts).where(eq(posts.slug, v.slug as string)).get();
      if (dup) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const result = db
      .update(posts)
      .set({
        ...v,
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
    if (!(await requireAuth([PERMISSIONS.posts]))) {
      return unauthorizedJson();
    }
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
