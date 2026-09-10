import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";

export type AdminTheme = "light" | "dark";

function keyFor(userId: string) {
  return `admin-theme:${userId}`;
}

export function getAdminTheme(userId: string): AdminTheme {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, keyFor(userId)))
    .get();
  return row?.value === "dark" ? "dark" : "light";
}

export function setAdminTheme(userId: string, theme: AdminTheme) {
  db.insert(settings)
    .values({ key: keyFor(userId), value: theme })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: theme },
    })
    .run();
}