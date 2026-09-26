import { NextRequest, NextResponse } from "next/server";
import { getWelcomeItems } from "@/lib/welcome";
import {
  deleteWelcomeSubmission,
  getWelcomeSubmissions,
  type WelcomeSubmission,
} from "@/lib/welcome-submissions";
import { deviceLabel, normalizeSignals } from "@/lib/visitor";
import { maskIp } from "@/lib/privacy";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

function clientKey(s: WelcomeSubmission): string {
  if (s.fingerprint) return `f:${s.fingerprint}`;
  if (s.ip) return `ip:${s.ip}`;
  if (s.visitorId) return `v:${s.visitorId}`;
  return `u:${s.id}`;
}

function shortClientKey(key: string): string {
  const raw = key.slice(2);
  if (!raw) return "?";
  return raw.length > 10 ? `${raw.slice(0, 10)}…` : raw;
}

export async function GET() {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();

  const submissions = getWelcomeSubmissions();
  const items = getWelcomeItems();
  const itemById = new Map(items.map((i) => [i.id, i]));
  const nameById = new Map(items.map((i) => [i.id, i.name]));

  const ordered = [...submissions].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id
  );
  const counter: Record<string, number> = {};
  const visitNumber = new Map<number, number>();
  const visitsTotal = new Map<number, number>();
  const visitorKey = new Map<number, string>();
  for (const s of ordered) {
    const k = clientKey(s);
    counter[k] = (counter[k] || 0) + 1;
    visitNumber.set(s.id, counter[k]);
    visitsTotal.set(s.id, counter[k]);
    visitorKey.set(s.id, shortClientKey(k));
  }

  return NextResponse.json({
    submissions: submissions.map((s) => {
      // Không gửi signals thô ra trình duyệt: UI chỉ cần nhãn thiết bị đã dẫn xuất.
      const { signals: rawSignals, ...rest } = s;
      const signals = normalizeSignals(rawSignals);
      return {
        ...rest,
        ip: maskIp(s.ip),
        popupName: nameById.get(s.itemId) || "Đã xóa",
        fields: itemById.get(s.itemId)?.fields ?? [],
        device: deviceLabel(signals),
        visitorKey: visitorKey.get(s.id) ?? "?",
        visitNumber: visitNumber.get(s.id) ?? 1,
        visitsTotal: visitsTotal.get(s.id) ?? 1,
        repeat: (visitsTotal.get(s.id) ?? 1) > 1,
      };
    }),
    stats: {
      total: submissions.length,
      uniqueVisitors: Object.keys(counter).length,
    },
  });
}

export async function DELETE(request: NextRequest) {
  const session = await requireAuth([PERMISSIONS.welcome]);
  if (!session) return unauthorizedJson();

  const body = (await request.json().catch(() => null)) as { id?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID không hợp lệ" }, { status: 400 });
  }

  try {
    deleteWelcomeSubmission(id);
  } catch {
    return NextResponse.json(
      { error: "Không thể xóa đăng ký" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}