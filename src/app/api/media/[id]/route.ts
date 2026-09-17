import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteUploadedFile } from "@/lib/storage";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth([PERMISSIONS.media]);
  if (!session) {
    return unauthorizedJson();
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = db.select().from(media).where(eq(media.id, numericId)).get();
  if (!existing) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    altText?: string;
    description?: string;
    tags?: string[];
  };

  if (
    (body.title !== undefined && typeof body.title !== "string") ||
    (body.altText !== undefined && typeof body.altText !== "string") ||
    (body.description !== undefined && typeof body.description !== "string")
  ) {
    return NextResponse.json({ error: "Invalid field type" }, { status: 400 });
  }

  const trim = (s: string, max: number) => s.trim().slice(0, max);
  const tags = Array.isArray(body.tags)
    ? body.tags
        .map((t) => String(t).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20)
        .map((t) => t.slice(0, 50))
    : undefined;

  const updated = db
    .update(media)
    .set({
      title: body.title !== undefined ? trim(body.title, 200) : existing.title,
      altText:
        body.altText !== undefined
          ? trim(body.altText, 300)
          : existing.altText,
      description:
        body.description !== undefined
          ? trim(body.description, 1000)
          : existing.description,
      tags: tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(media.id, numericId))
    .returning()
    .get();

  logAudit({
    action: AUDIT_ACTIONS.mediaUpdate,
    userId: Number(session.user?.id) || null,
    userEmail: session.user?.email ?? "",
    entity: "media",
    entityId: String(numericId),
    detail: { filename: updated.filename, title: updated.title },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth([PERMISSIONS.media]);
  if (!session) {
    return unauthorizedJson();
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = db.select().from(media).where(eq(media.id, numericId)).get();
  if (!existing) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  await deleteUploadedFile(existing.filename);
  db.delete(media).where(eq(media.id, numericId)).run();

  logAudit({
    action: AUDIT_ACTIONS.mediaDelete,
    userId: Number(session.user?.id) || null,
    userEmail: session.user?.email ?? "",
    entity: "media",
    entityId: String(numericId),
    detail: { filename: existing.filename },
    ip: getClientIp(request.headers),
  });

  return NextResponse.json({ success: true });
}