import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getCategoriesWithCounts } from "@/lib/categories";
import { slugify } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  try {
    return NextResponse.json(getCategoriesWithCounts());
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách danh mục" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAuth([PERMISSIONS.categories]))) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const icon =
      typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "📁";
    const color = typeof body.color === "string" && body.color.trim()
      ? body.color.trim()
      : "gray";

    if (!name) {
      return NextResponse.json(
        { field: "name", error: "Tên danh mục là bắt buộc" },
        { status: 400 }
      );
    }

    const slug = slugify(typeof body.slug === "string" ? body.slug : name);
    if (!slug) {
      return NextResponse.json(
        { field: "slug", error: "Slug không hợp lệ" },
        { status: 400 }
      );
    }

    const existing = db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .get();
    if (existing) {
      return NextResponse.json(
        { field: "slug", error: "Slug đã tồn tại" },
        { status: 409 }
      );
    }

    const result = db
      .insert(categories)
      .values({ slug, name, description, icon, color })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Không thể tạo danh mục" },
      { status: 500 }
    );
  }
}