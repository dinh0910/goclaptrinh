import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";
import {
  DEFAULT_ITEM,
  emptyWelcomeItem,
  normalizeItem,
  type WelcomeItem,
} from "./welcome-config";

const STORAGE_KEY = "welcome_items";
const LEGACY_KEY = "welcome";

export type { WelcomeItem };
export { DEFAULT_ITEM };

function readItems(): WelcomeItem[] {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, STORAGE_KEY))
    .get();
  if (!row) {
    const legacy = db
      .select()
      .from(settings)
      .where(eq(settings.key, LEGACY_KEY))
      .get();
    if (legacy) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(legacy.value);
      } catch {
        parsed = null;
      }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const legacyObj = parsed as Record<string, unknown>;
        if (
          legacyObj.enabled !== undefined &&
          !("active" in legacyObj)
        ) {
          legacyObj.active = Boolean(legacyObj.enabled);
        }
        const migrated: WelcomeItem[] = [normalizeItem(legacyObj)];
        db.insert(settings)
          .values({ key: STORAGE_KEY, value: JSON.stringify(migrated) })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: JSON.stringify(migrated) },
          })
          .run();
        db.delete(settings).where(eq(settings.key, LEGACY_KEY)).run();
        return migrated;
      }
    }
    return [];
  }
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(row.value);
  } catch {
    parsed = null;
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map(normalizeItem);
}

export function getWelcomeItems(): WelcomeItem[] {
  return readItems();
}

export function getActiveWelcome(): WelcomeItem | null {
  const items = readItems().filter((i) => i.title);
  if (items.length === 0) return null;
  return items.find((i) => i.active) ?? items[0];
}

export function findWelcomeItem(id: string): WelcomeItem | null {
  return readItems().find((i) => i.id === id) ?? null;
}

export function setWelcomeItems(items: WelcomeItem[]): boolean {
  if (!Array.isArray(items) || items.length === 0) return false;
  const normalized = (items as unknown[]).map((i) =>
    normalizeItem(i as Record<string, unknown>)
  );
  const hasActive = normalized.some((i) => i.active);
  if (!hasActive) normalized[0].active = true;
  db.insert(settings)
    .values({ key: STORAGE_KEY, value: JSON.stringify(normalized) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(normalized) },
    })
    .run();
  return true;
}

export function newWelcomeItem(): WelcomeItem {
  return emptyWelcomeItem();
}