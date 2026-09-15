import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/credentials";

/**
 * Two-step login helper: verifies email + password WITHOUT issuing a session.
 * Returns whether the account needs a TOTP code so the client can show the
 * second step. Response shape never reveals whether an email exists.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";

  const result = await verifyCredentials(email, password, request.headers, undefined, {
    checkMfa: false,
    auditSuccess: false,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true, mfaRequired: result.mfaRequired });
}