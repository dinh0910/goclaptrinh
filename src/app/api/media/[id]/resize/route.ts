import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveUploadPath } from "@/lib/media";
import fs from "fs";
import sharp from "sharp";

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
    // Fit image within the box, preserving aspect ratio. No enlargement limit,
    // so the image may scale up as well as down to the requested size.
    const output = await sharp(filepath)
      .resize(width, height, { fit: "inside" })
      .toBuffer();

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