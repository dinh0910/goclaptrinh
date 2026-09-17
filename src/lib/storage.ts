import path from "path";
import fs from "fs";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

/**
 * Storage adapter: Cloudflare R2 (S3-compatible) khi đủ biến env, ngược lại
 * fallback xuống đĩa cục bộ (public/uploads) — giúp chạy dev mà không cần R2.
 *
 * Env:
 *   R2_ACCOUNT_ID           — Cloudflare Account ID
 *   R2_ACCESS_KEY_ID        — R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY    — R2 API token Secret Access Key
 *   R2_BUCKET               — tên bucket (VD: media)
 *   R2_PUBLIC_URL           — base URL công khai (custom domain hoặc r2.dev),
 *                             không có trailing slash. VD: https://media.goclaptrinh.io.vn
 */

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const r2AccountId = process.env.R2_ACCOUNT_ID || "";
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const r2Bucket = process.env.R2_BUCKET || "";
const r2PublicUrl = (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");

export const isRemoteStorage = Boolean(
  r2AccountId && r2AccessKeyId && r2SecretAccessKey && r2Bucket
);

/** Object key prefix bên trong bucket. */
const OBJECT_PREFIX = "uploads";

function objectKey(filename: string): string {
  return `${OBJECT_PREFIX}/${filename}`;
}

export function resolveUploadPath(filename: string): string {
  const filepath = path.resolve(UPLOAD_DIR, filename);
  if (!filepath.startsWith(path.resolve(UPLOAD_DIR) + path.sep)) {
    throw new Error("Invalid filename");
  }
  return filepath;
}

export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

let s3: S3Client | null = null;

function getS3(): S3Client {
  if (!isRemoteStorage) {
    throw new Error("R2 chưa được cấu hình (thiếu biến môi trường)");
  }
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey,
      },
    });
  }
  return s3;
}

/** Lưu file vào R2 (hoặc đĩa cục bộ khi chưa cấu hình R2). */
export async function saveUploadedFile(
  filename: string,
  bytes: Buffer,
  contentType: string
): Promise<void> {
  if (isRemoteStorage) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey(filename),
        Body: bytes,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    return;
  }
  ensureUploadDir();
  fs.writeFileSync(resolveUploadPath(filename), bytes);
}

/** Đọc nội dung file. Trả null nếu không tồn tại. */
export async function readUploadedFile(
  filename: string
): Promise<Buffer | null> {
  if (isRemoteStorage) {
    try {
      const res = await getS3().send(
        new GetObjectCommand({ Bucket: r2Bucket, Key: objectKey(filename) })
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }
  const filepath = resolveUploadPath(filename);
  if (!fs.existsSync(filepath)) return null;
  return fs.readFileSync(filepath);
}

/** Xóa file. */
export async function deleteUploadedFile(filename: string): Promise<boolean> {
  if (isRemoteStorage) {
    try {
      await getS3().send(
        new DeleteObjectCommand({ Bucket: r2Bucket, Key: objectKey(filename) })
      );
      return true;
    } catch {
      return false;
    }
  }
  const filepath = resolveUploadPath(filename);
  if (!fs.existsSync(filepath)) return false;
  fs.unlinkSync(filepath);
  return true;
}

/** URL công khai của file: R2 custom domain hoặc /uploads/... cục bộ. */
export function getMediaUrl(filename: string): string {
  if (isRemoteStorage && r2PublicUrl) {
    return `${r2PublicUrl}/${OBJECT_PREFIX}/${filename}`;
  }
  return `/${OBJECT_PREFIX}/${filename}`;
}