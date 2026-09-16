import { db, sqliteClient } from "@/lib/db";
import { courseLevels } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import type { CourseLevel } from "@/lib/types";

export function getAllCourseLevels(): CourseLevel[] {
  return db
    .select()
    .from(courseLevels)
    .orderBy(asc(courseLevels.sortOrder), asc(courseLevels.id))
    .all();
}

export function getCourseLevelByKey(key: string): CourseLevel | null {
  return db.select().from(courseLevels).where(eq(courseLevels.key, key)).get() ?? null;
}

export function isValidCourseLevel(key: string): boolean {
  return !!db.select().from(courseLevels).where(eq(courseLevels.key, key)).get();
}

export function getCourseLevelsMap(): Record<string, CourseLevel> {
  const map: Record<string, CourseLevel> = {};
  for (const level of getAllCourseLevels()) {
    map[level.key] = level;
  }
  return map;
}

export function countCoursesByLevel(levelKey: string): number {
  const row = sqliteClient
    .prepare("SELECT count(*) AS c FROM courses WHERE level = ? AND published = 1")
    .get(levelKey) as { c: number };
  return Number(row.c);
}

/** Levels guaranteed to exist even if the table is empty (used by frontend fallbacks). */
export function fallbackCourseLevels(): CourseLevel[] {
  return [
    { id: 1, key: "beginner", label: "Cơ bản", description: "", icon: "🌱", color: "green", sortOrder: 1 },
    { id: 2, key: "intermediate", label: "Trung cấp", description: "", icon: "⚡", color: "amber", sortOrder: 2 },
    { id: 3, key: "advanced", label: "Nâng cao", description: "", icon: "🔥", color: "red", sortOrder: 3 },
  ];
}