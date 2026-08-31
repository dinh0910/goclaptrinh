import path from "path";
import fs from "fs";
import sharp from "sharp";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function resolveUploadPath(filename: string): string {
  const filepath = path.resolve(UPLOAD_DIR, filename);
  if (!filepath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    throw new Error("Invalid filename");
  }
  return filepath;
}

export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

export function deleteUploadedFile(filename: string): boolean {
  const filepath = resolveUploadPath(filename);
  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
}