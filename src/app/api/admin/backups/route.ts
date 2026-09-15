import { NextResponse } from "next/server";
import { requireAuth, unauthorizedJson } from "@/lib/permissions";
import {
  listBackups,
  createBackup,
  deleteBackup,
  restoreBackup,
  getBackupIntervalHours,
  setBackupIntervalHours,
} from "@/lib/backup";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { getClientIp } from "@/lib/visitor";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET() {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  return NextResponse.json({
    backups: listBackups(),
    intervalHours: getBackupIntervalHours(),
  });
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as {
    action?: string;
    filename?: string;
    hours?: number;
  } | null;
  if (!body?.action) return badRequest("Thiếu hành động");

  const userId = Number(session.user?.id) || null;
  const userEmail = session.user?.email ?? "";
  const ip = () => getClientIp(request.headers);

  if (body.action === "create") {
    try {
      const backup = createBackup();
      logAudit({
        action: AUDIT_ACTIONS.backupCreate,
        userId,
        userEmail,
        entity: "backup",
        entityId: backup.filename,
        detail: { size: backup.size },
        ip: ip(),
      });
      return NextResponse.json({ backup }, { status: 201 });
    } catch (err) {
      console.error("Backup create failed", err);
      return NextResponse.json(
        { error: "Không thể tạo backup" },
        { status: 500 }
      );
    }
  }

  if (body.action === "restore") {
    const filename = typeof body.filename === "string" ? body.filename : "";
    try {
      const { restored } = restoreBackup(filename);
      logAudit({
        action: AUDIT_ACTIONS.backupRestore,
        userId,
        userEmail,
        entity: "backup",
        entityId: filename,
        detail: { restored },
        ip: ip(),
      });
      return NextResponse.json({ ok: true, restored });
    } catch (err) {
      console.error("Backup restore failed", err);
      return NextResponse.json(
        {
          error:
            err instanceof Error
              ? `Không thể khôi phục backup: ${err.message}`
              : "Không thể khôi phục backup",
        },
        { status: 400 }
      );
    }
  }

  if (body.action === "delete") {
    const filename = typeof body.filename === "string" ? body.filename : "";
    const ok = deleteBackup(filename);
    if (!ok) return badRequest("Không thể xóa file backup này");
    logAudit({
      action: AUDIT_ACTIONS.backupDelete,
      userId,
      userEmail,
      entity: "backup",
      entityId: filename,
      ip: ip(),
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "interval") {
    const hours = Number(body.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24 * 365) {
      return badRequest("Khoảng thời gian không hợp lệ");
    }
    setBackupIntervalHours(hours);
    return NextResponse.json({ intervalHours: hours });
  }

  return badRequest("Hành động không hợp lệ");
}