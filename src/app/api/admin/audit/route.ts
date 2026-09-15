import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson } from "@/lib/permissions";
import { listAuditLogs } from "@/lib/audit";

export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.user?.id) return unauthorizedJson();

  const params = request.nextUrl.searchParams;
  const page = Math.max(Number(params.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 30), 1), 200);
  const action = params.get("action") ?? undefined;
  const q = params.get("q")?.trim() || undefined;

  const { total, rows } = listAuditLogs({
    limit,
    offset: (page - 1) * limit,
    action,
    q,
  });

  return NextResponse.json({ rows, total, page, limit });
}