import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { getImageDimensions, resolveUploadPath, UPLOAD_DIR } from "@/lib/media";
import sharp from "sharp";
import fs from "fs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_WIDTH = 1600; // max display width in px to keep pages fast
const ESTIMATED_QUALITY = 80;

// Raster types we can safely re-encode/compress. Skip GIF to keep animation.
const COMPRESSIBLE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Capture original dimensions BEFORE any compression so the
    // "restore original size" feature can restore the true source size.
    const { width: origWidth, height: origHeight } = await getImageDimensions(bytes);

    // Compress/optimize raster images to keep pages fast (SEO/CWV).
    let savedBytes = bytes;
    let savedWidth = origWidth;
    let savedHeight = origHeight;
    let savedSize = bytes.length;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    let savedExt = ext;

    if (COMPRESSIBLE_TYPES.includes(file.type)) {
      try {
        let pipeline = sharp(bytes, { animated: false });
        // Downscale very wide/tall images to cap resolution.
        if (origWidth > MAX_WIDTH) {
          pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }
        // Re-encode using a per-format quality target to cut file size.
        if (file.type === "image/png") {
          pipeline = pipeline.png({ quality: ESTIMATED_QUALITY, compressionLevel: 9 });
        } else if (file.type === "image/webp") {
          pipeline = pipeline.webp({ quality: ESTIMATED_QUALITY });
        } else {
          pipeline = pipeline.jpeg({ quality: ESTIMATED_QUALITY, mozjpeg: true });
        }
        const optimized = await pipeline.toBuffer();
        // Only keep the optimized buffer if it is actually smaller.
        if (optimized.length < bytes.length) {
          savedBytes = optimized;
          savedSize = optimized.length;
          const meta = await sharp(optimized).metadata();
          savedWidth = meta.width ?? origWidth;
          savedHeight = meta.height ?? origHeight;
          savedExt = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        }
      } catch {
        // If compression fails for any reason, fall back to the raw bytes.
        savedBytes = bytes;
        savedSize = bytes.length;
        savedWidth = origWidth;
        savedHeight = origHeight;
        savedExt = ext;
      }
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${savedExt}`;
    const filepath = resolveUploadPath(filename);
    fs.writeFileSync(filepath, savedBytes);

    const width = savedWidth;
    const height = savedHeight;
    const now = new Date().toISOString();

    const title = (formData.get("title") as string | null)?.trim() || "";
    const altText = (formData.get("alt") as string | null)?.trim() || "";
    const description = (formData.get("description") as string | null)?.trim() || "";
    const rawTags = (formData.get("tags") as string | null)?.trim() || "";
    const tags = rawTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const row = db
      .insert(media)
      .values({
        filename,
        url: `/uploads/${filename}`,
        originalName: file.name,
        mimeType: file.type,
        size: savedSize,
        width,
        height,
        originalWidth: origWidth,
        originalHeight: origHeight,
        title,
        altText,
        description,
        tags,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: media.id })
      .get();

    return NextResponse.json(
      { url: `/uploads/${filename}`, id: row.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}