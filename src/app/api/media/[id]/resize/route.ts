import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readUploadedFile, saveUploadedFile } from "@/lib/storage";
import sharp from "sharp";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

const MAX_RESIZE_BYTES = 1 * 1024 * 1024; // 1MB
const MAX_DIM = 8192; // cap to prevent memory-exhaustion (sharp allocates per-pixel)

export async function POST(
  request: NextRequest,
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

  if (width > MAX_DIM || height > MAX_DIM) {
    return NextResponse.json(
      { error: `Width/height must not exceed ${MAX_DIM}px` },
      { status: 400 }
    );
  }

  if (existing.mimeType.startsWith("video/")) {
    return NextResponse.json(
      { error: "Chỉ hỗ trợ resize ảnh, không hỗ trợ video" },
      { status: 400 }
    );
  }

  const bytes = await readUploadedFile(existing.filename);
  if (!bytes) {
    return NextResponse.json({ error: "File missing on storage" }, { status: 404 });
  }

  try {
    // Resize to the exact requested dimensions.
    const output = await sharp(bytes)
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

    await saveUploadedFile(existing.filename, output, existing.mimeType);

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