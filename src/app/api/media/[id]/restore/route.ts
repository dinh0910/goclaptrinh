import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveUploadPath } from "@/lib/media";
import fs from "fs";
import sharp from "sharp";

export async function POST(
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

  const originalWidth = existing.originalWidth || existing.width;
  const originalHeight = existing.originalHeight || existing.height;

  const filepath = resolveUploadPath(existing.filename);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  try {
    const output = await sharp(filepath)
      .resize(originalWidth, originalHeight, { fit: "fill" })
      .toBuffer();

    fs.writeFileSync(filepath, output);

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
