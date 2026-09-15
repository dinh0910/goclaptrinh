import { NextResponse } from "next/server";
import { requireAuth, unauthorizedJson } from "@/lib/permissions";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  MFA_ISSUER,
  newMfaSetup,
  verifyMfaCode,
  isMfaEnabled,
  enableMfaForUser,
  disableMfaForUser,
} from "@/lib/mfa";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  const user = db.select().from(users).where(eq(users.id, Number(session.user.id))).get();
  if (!user) return unauthorizedJson();

  return NextResponse.json({
    enabled: isMfaEnabled(user),
    email: user.email,
    issuer: MFA_ISSUER,
  });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  const user = db.select().from(users).where(eq(users.id, Number(session.user.id))).get();
  if (!user) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    code?: string;
    secret?: string;
  } | null;
  const action = body?.action;

  const ip = () => getClientIp(request.headers);

  if (action === "setup") {
    if (isMfaEnabled(user)) {
      return badRequest("Xác thực hai lớp đã được bật");
    }
    if (!/^\d{6}$/.test((body?.code ?? "").trim())) {
      return badRequest("Vui lòng nhập 6 số trong ứng dụng xác thực");
    }
    const { secret, uri } = newMfaSetup(user.email);
    return NextResponse.json({ secret, uri });
  }

  if (action === "enable") {
    if (isMfaEnabled(user)) {
      return badRequest("Xác thực hai lớp đã được bật");
    }
    const secret = body?.secret;
    const code = body?.code;
    if (typeof secret !== "string" || !/^[A-Z2-7]{16,128}$/i.test(secret)) {
      return badRequest("Mã bảo mật không hợp lệ");
    }
    if (!verifyMfaCode(secret, code ?? "")) {
      return badRequest("Mã xác thực không đúng — hãy thử lại");
    }
    enableMfaForUser(user.id, secret.toUpperCase());
    logAudit({
      action: AUDIT_ACTIONS.mfaSetup,
      userId: user.id,
      userEmail: user.email,
      detail: { method: "totp" },
      ip: ip(),
    });
    return NextResponse.json({ enabled: true });
  }

  if (action === "disable") {
    if (!isMfaEnabled(user)) {
      return badRequest("Xác thực hai lớp đang tắt");
    }
    const code = body?.code;
    if (!disableMfaForUser(user.id, code ?? "")) {
      return badRequest("Mã xác thực không đúng — tài khoản chưa được tắt");
    }
    logAudit({
      action: AUDIT_ACTIONS.mfaDisable,
      userId: user.id,
      userEmail: user.email,
      detail: { method: "totp" },
      ip: ip(),
    });
    return NextResponse.json({ enabled: false });
  }

  return badRequest("Hành động không hợp lệ");
}