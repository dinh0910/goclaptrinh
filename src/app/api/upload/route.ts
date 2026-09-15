import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { resolveUploadPath, UPLOAD_DIR } from "@/lib/media";
import sharp from "sharp";
import fs from "fs";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_WIDTH = 1600; // max display width in px to keep pages fast
const ESTIMATED_QUALITY = 80;

export async function POST(request: NextRequest) {
  const session = await requireAuth([PERMISSIONS.media, PERMISSIONS.posts]);
  if (!session) {
    return unauthorizedJson();
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

    // Sniff the REAL image format from content via sharp. file.type / file.name
    // are client-controlled and MUST NOT be trusted for the on-disk extension.
    let meta;
    try {
      meta = await sharp(bytes).metadata();
    } catch {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }
    if (!meta.format) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    const SAFE_MIME: Record<string, string> = {
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const format = SAFE_MIME[meta.format] ? meta.format : null;
    if (!format) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const origWidth = meta.width ?? 0;
    const origHeight = meta.height ?? 0;
    if (!origWidth || !origHeight) {
      return NextResponse.json({ error: "Invalid image dimensions" }, { status: 400 });
    }

    let savedBytes = bytes;
    let savedWidth = origWidth;
    let savedHeight = origHeight;
    let savedSize = bytes.length;
    const savedExt = format;

    if (format === "gif") {
      // Keep GIF bytes as-is (animation). Extension is derived from format, so
      // a spoofed ".html" filename can never become the stored extension.
      savedBytes = bytes;
      savedSize = bytes.length;
    } else {
      // Re-encode raster images so any trailing/appended payload in the
      // original buffer is discarded by the encoder.
      try {
        let pipeline = sharp(bytes, { animated: false });
        if (origWidth > MAX_WIDTH) {
          pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }
        if (format === "png") {
          pipeline = pipeline.png({ quality: ESTIMATED_QUALITY, compressionLevel: 9 });
        } else if (format === "webp") {
          pipeline = pipeline.webp({ quality: ESTIMATED_QUALITY });
        } else {
          pipeline = pipeline.jpeg({ quality: ESTIMATED_QUALITY, mozjpeg: true });
        }
        savedBytes = await pipeline.toBuffer();
        savedSize = savedBytes.length;
        const encoded = await sharp(savedBytes).metadata();
        savedWidth = encoded.width ?? origWidth;
        savedHeight = encoded.height ?? origHeight;
      } catch {
        return NextResponse.json({ error: "Image processing failed" }, { status: 400 });
      }
    }

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${savedExt}`;
    const filepath = resolveUploadPath(filename);
    fs.writeFileSync(filepath, savedBytes);

    const width = savedWidth;
    const height = savedHeight;
    const now = new Date().toISOString();

    const title = (formData.get("title") as string | null)?.trim().slice(0, 200) || "";
    const altText = (formData.get("alt") as string | null)?.trim().slice(0, 300) || "";
    const description = (formData.get("description") as string | null)?.trim().slice(0, 1000) || "";
    const rawTags = (formData.get("tags") as string | null)?.trim().slice(0, 1000) || "";
    const tags = rawTags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 20);

    const row = db
      .insert(media)
      .values({
        filename,
        url: `/uploads/${filename}`,
        originalName: file.name.slice(0, 255),
        mimeType: SAFE_MIME[format],
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

  logAudit({
    action: AUDIT_ACTIONS.mediaCreate,
    userId: Number(session.user?.id) || null,
    userEmail: session.user?.email ?? "",
    entity: "media",
    entityId: String(row.id),
    detail: { filename, size: savedSize, width, height },
    ip: getClientIp(request.headers),
  });

    return NextResponse.json(
      { url: `/uploads/${filename}`, id: row.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}