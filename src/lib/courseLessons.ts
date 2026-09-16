import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { courseLessons } from "@/lib/db/schema";
import { slugify } from "@/lib/utils";

export function uniqueLessonSlug(
  title: string,
  excludeLessonId?: number
): string {
  const base = slugify(title) || "bai-hoc";
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = db
      .select({ id: courseLessons.id })
      .from(courseLessons)
      .where(eq(courseLessons.slug, candidate))
      .get();
    if (!existing || existing.id === excludeLessonId) {
      return candidate;
    }
    candidate = `${base}-${n++}`;
  }
}