import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { welcomeSubmissions } from "./db/schema";

export interface WelcomeSubmission {
  id: number;
  itemId: string;
  data: Record<string, string>;
  createdAt: string;
}

export function getWelcomeSubmissions(): WelcomeSubmission[] {
  return db
    .select()
    .from(welcomeSubmissions)
    .orderBy(desc(welcomeSubmissions.createdAt), desc(welcomeSubmissions.id))
    .all();
}

export function getWelcomeSubmissionsByItem(
  itemId: string
): WelcomeSubmission[] {
  return db
    .select()
    .from(welcomeSubmissions)
    .where(eq(welcomeSubmissions.itemId, itemId))
    .orderBy(desc(welcomeSubmissions.createdAt))
    .all();
}

export function addWelcomeSubmission(
  itemId: string,
  data: Record<string, string>
): WelcomeSubmission {
  const row = db
    .insert(welcomeSubmissions)
    .values({ itemId, data })
    .returning()
    .get();
  return row;
}

export function deleteWelcomeSubmission(id: number): boolean {
  const result = db
    .delete(welcomeSubmissions)
    .where(eq(welcomeSubmissions.id, id))
    .run();
  return result.changes > 0;
}