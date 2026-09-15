import { createHmac, randomBytes } from "crypto";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += B32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

export function base32Decode(input: string): Buffer {
  const cleaned = input.toUpperCase().replace(/\s|=+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of cleaned) {
    const idx = B32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

/** RFC 6238 TOTP generation (HMAC-SHA1, 6 digits, 30s period by default). */
export function generateTotp(
  secret: string,
  opts?: { timeStepSec?: number; digits?: number; atSeconds?: number }
): string {
  const step = opts?.timeStepSec ?? 30;
  const digits = opts?.digits ?? 6;
  const at = opts?.atSeconds ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(at / step);

  const counterBuf = Buffer.alloc(8);
  counterBuf.writeBigUInt64BE(BigInt(counter));

  const hmac = createHmac("sha1", base32Decode(secret)).update(counterBuf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];

  return (bin % 10 ** digits).toString().padStart(digits, "0");
}

/** Verify a token within a ±window time-step tolerance. */
export function verifyTotp(
  secret: string,
  token: string,
  opts?: { timeStepSec?: number; window?: number }
): boolean {
  const step = opts?.timeStepSec ?? 30;
  const window = opts?.window ?? 1;
  if (!/^\d{6}$/.test(token)) return false;

  const now = Math.floor(Date.now() / 1000);
  for (let i = -window; i <= window; i++) {
    const expected = generateTotp(secret, { timeStepSec: step, atSeconds: now + i * step });
    if (expected === token) return true;
  }
  return false;
}

/** Generate a new random base32 secret (160 bits, RFC 4226 recommendation). */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUri(secret: string, label: string, issuer: string): string {
  const encodedLabel = encodeURIComponent(issuer) + ":" + encodeURIComponent(label);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodedLabel}?${params.toString()}`;
}