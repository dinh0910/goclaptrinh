import { NextResponse } from "next/server";
import { getActiveWelcome } from "@/lib/welcome";

export const dynamic = "force-dynamic";

export async function GET() {
  const item = getActiveWelcome();
  return NextResponse.json({ item });
}