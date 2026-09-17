import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { saveUploadedFile, getMediaUrl } from "@/lib/storage";
import sharp from "sharp";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const VIDEO_MAX_MB = Number(process.env.MEDIA_VIDEO_MAX_MB ?? 512) || 512;
const VIDEO_MAX_SIZE = VIDEO_MAX_MB * 1024 * 1024;
const MAX_WIDTH = 1600; // max display width in px to keep pages fast
const ESTIMATED_QUALITY = 80;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const VIDEO_EXT_TO_MIME: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
  mov: "video/quicktime",
};

function extOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

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

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = extOf(file.name || "");
    const isVideo = Boolean(VIDEO_EXT_TO_MIME[ext]);

    if (isVideo) {
      if (bytes.length === 0) {
        return NextResponse.json({ error: "Empty video file" }, { status: 400 });
      }
      if (bytes.length > VIDEO_MAX_SIZE) {
        return NextResponse.json(
          { error: `File quá lớn (tối đa ${VIDEO_MAX_MB}MB đối với video)` },
          { status: 400 }
        );
      }

      const mimeType = VIDEO_EXT_TO_MIME[ext];
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await saveUploadedFile(filename, bytes, mimeType);

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

      const url = getMediaUrl(filename);
      const row = db
        .insert(media)
        .values({
          filename,
          url,
          originalName: file.name.slice(0, 255),
          mimeType,
          size: bytes.length,
          width: 0,
          height: 0,
          originalWidth: 0,
          originalHeight: 0,
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
        detail: { filename, size: bytes.length, width: 0, height: 0 },
        ip: getClientIp(request.headers),
      });

      return NextResponse.json({ url, id: row.id }, { status: 201 });
    }

    if (bytes.length > IMAGE_MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

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

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${format}`;
    const mimeType = SAFE_MIME[format];
    await saveUploadedFile(filename, savedBytes, mimeType);

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

    const url = getMediaUrl(filename);
    const row = db
      .insert(media)
      .values({
        filename,
        url,
        originalName: file.name.slice(0, 255),
        mimeType,
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

    return NextResponse.json({ url, id: row.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}