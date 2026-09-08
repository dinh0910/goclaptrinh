import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireAuth, unauthorizedJson, PERMISSIONS } from "@/lib/permissions";

export async function GET() {
  if (!(await requireAuth([PERMISSIONS.media, PERMISSIONS.posts]))) {
    return unauthorizedJson();
  }

  const rows = db.select().from(media).orderBy(desc(media.createdAt)).all();
  return NextResponse.json(rows);
}