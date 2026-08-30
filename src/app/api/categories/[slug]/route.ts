import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, posts } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .get();
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Tên danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const newSlug = slugify(
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug
        : name
    );

    if (!newSlug) {
      return NextResponse.json(
        { error: "Slug không hợp lệ" },
        { status: 400 }
      );
    }

    if (newSlug !== slug) {
      const duplicate = db
        .select()
        .from(categories)
        .where(eq(categories.slug, newSlug))
        .get();
      if (duplicate) {
        return NextResponse.json({ error: "Slug đã tồn tại" }, { status: 409 });
      }
      db.update(posts)
        .set({ category: newSlug })
        .where(eq(posts.category, slug))
        .run();
    }

    const result = db
      .update(categories)
      .set({ slug: newSlug, name, description })
      .where(eq(categories.slug, slug))
      .returning()
      .get();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật danh mục" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .get();
    if (!existing) {
      return NextResponse.json(
        { error: "Không tìm thấy danh mục" },
        { status: 404 }
      );
    }

    const postCount = db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.category, slug))
      .get();

    if (Number(postCount?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Không thể xóa danh mục còn chứa bài viết" },
        { status: 400 }
      );
    }

    db.delete(categories).where(eq(categories.slug, slug)).run();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa danh mục" },
      { status: 500 }
    );
  }
}