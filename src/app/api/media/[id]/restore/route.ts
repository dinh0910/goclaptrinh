import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readUploadedFile, saveUploadedFile } from "@/lib/storage";
import sharp from "sharp";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth([PERMISSIONS.media]))) {
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

  if (existing.mimeType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ khôi phục kích thước ảnh, không hỗ trợ video" },
      { status: 400 }
    );
  }

  const originalWidth = existing.originalWidth || existing.width;
  const originalHeight = existing.originalHeight || existing.height;

  const bytes = await readUploadedFile(existing.filename);
  if (!bytes) {
    return NextResponse.json({ error: "File missing on storage" }, { status: 404 });
  }

  try {
    const output = await sharp(bytes)
      .resize(originalWidth, originalHeight, { fit: "fill" })
      .toBuffer();

    await saveUploadedFile(existing.filename, output, existing.mimeType);

    const meta = await sharp(output).metadata();

    db.update(media)
      .set({
        width: meta.width || originalWidth,
        height: meta.height || originalHeight,
        size: output.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(media.id, numericId))
      .run();

    const updated = db
      .select()
      .from(media)
      .where(eq(media.id, numericId))
      .get();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Restore failed" }, { status: 500 });
  }
}
