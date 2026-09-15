import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";
import { getAnalytics } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth([PERMISSIONS.analytics]);
    if (!session) return unauthorizedJson();

    const search = request.nextUrl.searchParams;
    const start = search.get("start");
    const end = search.get("end");
    if (start && end) {
      const data = getAnalytics({ start, end });
      return NextResponse.json(data);
    }

    const raw = Number(search.get("range") || "30");
    const range = Number.isInteger(raw) ? raw : 30;
    const data = getAnalytics({ days: range });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Không thể tải dữ liệu thống kê" }, { status: 500 });
  }
}