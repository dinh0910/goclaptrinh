import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { deleteUploadedFile } from "@/lib/media";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : undefined;

  const updated = db
    .update(media)
    .set({
      title:
        body.title !== undefined ? String(body.title).trim() : existing.title,
      altText:
        body.altText !== undefined
          ? String(body.altText).trim()
          : existing.altText,
      description:
        body.description !== undefined
          ? String(body.description).trim()
          : existing.description,
      tags: tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(media.id, numericId))
    .returning()
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  deleteUploadedFile(existing.filename);
  db.delete(media).where(eq(media.id, numericId)).run();

  return NextResponse.json({ success: true });
}