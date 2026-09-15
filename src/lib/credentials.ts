import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, type UserRow } from "./db/schema";
import { loginLimiter } from "./rate-limit";
import { isMfaEnabled, verifyMfaCode } from "./mfa";
import { getClientIp } from "./visitor";
import { logAudit } from "./audit";

const DUMMY_BCRYPT_HASH =
  "$2b$12$.Vgu.OYIYkb9cWX9.K5A9.oPNTJji8OagOlqWVLox07Wij0cj5YT.";

export type CredentialsResult =
  | { ok: true; user: UserRow; mfaRequired: boolean }
  | { ok: false; reason: "rate-limited" | "invalid" };

/** Verify email + password (and TOTP when the account has MFA enabled).
 *  Consumes one login rate-limit slot per call. Do not call twice per attempt
 *  unless you intentionally want stricter throttling for MFA flows.
 *  opts.checkMfa=false: use from the two-step login status endpoint to discover
 *  whether a TOTP code is required (password-only check). */
export async function verifyCredentials(
  email: string,
  password: string,
  headers?: Pick<Headers, "get">,
  totp?: string,
  opts?: { checkMfa?: boolean; auditSuccess?: boolean }
): Promise<CredentialsResult> {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const ip = getClientIp(headers ?? new Headers());
  const key = `${normalizedEmail}|${ip || "anon"}`;
  const checkMfa = opts?.checkMfa !== false;
  const auditSuccess = opts?.auditSuccess !== false;

  const fail = async (reason: "rate-limited" | "invalid"): Promise<CredentialsResult> => {
    logAudit({
      action: "login.failed",
      userEmail: normalizedEmail,
      detail: { reason, ip },
      ip,
    });
    return { ok: false, reason };
  };

  if (!normalizedEmail || !password) {
    return fail("invalid");
  }

  if (!loginLimiter.allow(key)) {
    return fail("rate-limited");
  }

  const user = db.select().from(users).where(eq(users.email, normalizedEmail)).get();
  if (!user) {
    // Equalize timing so attackers can't tell whether the email exists.
    await bcrypt.compare("x", DUMMY_BCRYPT_HASH);
    return fail("invalid");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return fail("invalid");
  }

  const mfaRequired = isMfaEnabled(user);
  if (checkMfa && mfaRequired && !verifyMfaCode(user.totpSecret, totp ?? "")) {
    return fail("invalid");
  }

  if (auditSuccess) {
    logAudit({
      action: "login.success",
      userId: user.id,
      userEmail: user.email,
      ip,
    });
  }

  return { ok: true, user, mfaRequired };
}

export async function verifyUserPassword(
  userId: number,
  password: string
): Promise<boolean> {
  const user = db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return false;
  return bcrypt.compare(password, user.password);
}