import sharp from "sharp";
import {
  UPLOAD_DIR,
  resolveUploadPath,
  ensureUploadDir,
  saveUploadedFile,
  readUploadedFile,
  deleteUploadedFile,
  getMediaUrl,
  isRemoteStorage,
} from "./storage";

export {
  UPLOAD_DIR,
  resolveUploadPath,
  ensureUploadDir,
  saveUploadedFile,
  readUploadedFile,
  deleteUploadedFile,
  getMediaUrl,
  isRemoteStorage,
};

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