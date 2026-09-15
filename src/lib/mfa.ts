import { generateTotpSecret, otpauthUri, verifyTotp } from "./totp";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type UserRow } from "./db/schema";

export const MFA_ISSUER = "GocLapTrinh";

export function newMfaSetup(label: string) {
  const secret = generateTotpSecret();
  const uri = otpauthUri(secret, label, MFA_ISSUER);
  return { secret, uri };
}

export function verifyMfaCode(secret: string, code: string): boolean {
  if (!secret || !code.trim()) return false;
  const cleaned = code.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return false;
  return verifyTotp(secret, cleaned);
}

export function isMfaEnabled(user: Pick<UserRow, "totpEnabled" | "totpSecret"> | null | undefined) {
  return Boolean(user?.totpEnabled && user.totpSecret);
}

/** Persist a validated TOTP secret and mark the account as MFA-protected. */
export function enableMfaForUser(userId: number, secret: string) {
  db.update(users)
    .set({ totpSecret: secret, totpEnabled: true })
    .where(eq(users.id, userId))
    .run();
}

/** Verify the current code against the stored secret, then disable MFA. */
export function disableMfaForUser(userId: number, code: string): boolean {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user?.totpSecret) return false;
  if (!verifyMfaCode(user.totpSecret, code)) return false;
  db.update(users)
    .set({ totpSecret: "", totpEnabled: false })
    .where(eq(users.id, userId))
    .run();
  return true;
}