import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { getImageDimensions, resolveUploadPath, UPLOAD_DIR } from "@/lib/media";
import fs from "fs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

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

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = resolveUploadPath(filename);

    const bytes = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, bytes);

    const { width, height } = await getImageDimensions(bytes);
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
        size: file.size,
        width,
        height,
        originalWidth: width,
        originalHeight: height,
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