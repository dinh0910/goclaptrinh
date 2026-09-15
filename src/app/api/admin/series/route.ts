import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { series } from "@/lib/db/schema";
import { getSeriesWithCounts } from "@/lib/series";
import { slugify } from "@/lib/utils";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export async function GET() {
  try {
    return NextResponse.json(getSeriesWithCounts({ includeUnpublished: true }));
  } catch {
    return NextResponse.json(
      { error: "Không thể tải danh sách series" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.posts]);
    if (!session) {
      return unauthorizedJson();
    }
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const icon =
      typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "📚";

    if (!name) {
      return NextResponse.json(
        { field: "name", error: "Tên series là bắt buộc" },
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

    const existing = db.select().from(series).where(eq(series.slug, slug)).get();
    if (existing) {
      return NextResponse.json(
        { field: "slug", error: "Slug đã tồn tại" },
        { status: 409 }
      );
    }

    const result = db
      .insert(series)
      .values({ slug, name, description, icon })
      .returning()
      .get();

    logAudit({
      action: AUDIT_ACTIONS.seriesCreate,
      userId: Number(session.user?.id) || null,
      userEmail: session.user?.email ?? "",
      entity: "series",
      entityId: result.slug,
      detail: { name: result.name },
      ip: getClientIp(request.headers),
    });

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Không thể tạo series" }, { status: 500 });
  }
}