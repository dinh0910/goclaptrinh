import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { series, posts } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) {
      return unauthorizedJson();
    }
    const { slug } = await params;
    const existing = db.select().from(series).where(eq(series.slug, slug)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json(
        { field: "name", error: "Tên series là bắt buộc" },
        { status: 400 }
      );
    }

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const icon =
      typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : existing.icon;
    const newSlug = slugify(
      typeof body.slug === "string" && body.slug.trim() ? body.slug : name
    );

    if (!newSlug) {
      return NextResponse.json(
        { field: "slug", error: "Slug không hợp lệ" },
        { status: 400 }
      );
    }

    if (newSlug !== slug) {
      const duplicate = db.select().from(series).where(eq(series.slug, newSlug)).get();
      if (duplicate) {
        return NextResponse.json(
          { field: "slug", error: "Slug đã tồn tại" },
          { status: 409 }
        );
      }
    }

    const result = db
      .update(series)
      .set({ slug: newSlug, name, description, icon })
      .where(eq(series.slug, slug))
      .returning()
      .get();

    logAudit({
      action: AUDIT_ACTIONS.seriesUpdate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "series",
      entityId: result.slug,
      detail: { name: result.name },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Không thể cập nhật series" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) {
      return unauthorizedJson();
    }
    const { slug } = await params;
    const existing = db.select().from(series).where(eq(series.slug, slug)).get();
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy series" }, { status: 404 });
    }

    const postCount = db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.seriesId, existing.id))
      .get();

    if (Number(postCount?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Không thể xóa series còn chứa bài viết" },
        { status: 400 }
      );
    }

    db.delete(series).where(eq(series.slug, slug)).run();

    logAudit({
      action: AUDIT_ACTIONS.seriesDelete,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "series",
      entityId: slug,
      detail: { name: existing.name },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Không thể xóa series" }, { status: 500 });
  }
}