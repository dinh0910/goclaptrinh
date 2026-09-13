import { desc, eq } from "drizzle-orm";
import type { VisitorSignals } from "./visitor";
import { db } from "./db";
import { welcomeSubmissions } from "./db/schema";

export interface WelcomeSubmission {
  id: number;
  itemId: string;
  data: Record<string, string>;
  visitorId: string;
  signals: Partial<VisitorSignals>;
  fingerprint: string;
  ip: string;
  createdAt: string;
}

export interface SubmissionClientInfo {
  visitorId: string;
  signals: Partial<VisitorSignals>;
  fingerprint: string;
  ip: string;
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
  data: Record<string, string>,
  client: SubmissionClientInfo = {
    visitorId: "",
    signals: {},
    fingerprint: "",
    ip: "",
  }
): WelcomeSubmission {
  const row = db
    .insert(welcomeSubmissions)
    .values({
      itemId,
      data,
      visitorId: client.visitorId,
      signals: client.signals,
      fingerprint: client.fingerprint,
      ip: client.ip,
    })
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