import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveUploadPath } from "@/lib/media";
import fs from "fs";
import sharp from "sharp";

const MAX_RESIZE_BYTES = 1 * 1024 * 1024; // 1MB

export async function POST(
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

  const body = (await request.json()) as { width?: number; height?: number };
  const width = Math.round(Number(body.width));
  const height = Math.round(Number(body.height));

  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return NextResponse.json(
      { error: "Width and height must be positive integers" },
      { status: 400 }
    );
  }

  const filepath = resolveUploadPath(existing.filename);
  if (!fs.existsSync(filepath)) {
    return NextResponse.json({ error: "File missing on disk" }, { status: 404 });
  }

  try {
    // Resize to the exact requested dimensions.
    const output = await sharp(filepath)
      .resize(width, height, { fit: "fill" })
      .toBuffer();

    if (output.length > MAX_RESIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Ảnh sau khi resize vượt quá 1MB. Hãy giảm kích thước xuống.",
        },
        { status: 400 }
      );
    }

    fs.writeFileSync(filepath, output);

    const meta = await sharp(output).metadata();

    db.update(media)
      .set({
        width: meta.width || width,
        height: meta.height || height,
        size: output.length,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(media.id, numericId))
      .run();

    const updated = db.select().from(media).where(eq(media.id, numericId)).get();
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Resize failed" }, { status: 500 });
  }
}