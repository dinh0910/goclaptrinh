import { eq } from "drizzle-orm";
import { db } from "./db";
import { settings } from "./db/schema";
import {
  DEFAULT_HERO,
  deepMerge,
  type HeroConfig,
  type HeroPreset,
  type HeroTemplate,
} from "./hero-config";

const STORAGE_KEY = "hero";

export type { HeroConfig, HeroPreset, HeroTemplate };
export { DEFAULT_HERO };

function defaultPreset(): HeroPreset {
  return {
    id: "default",
    name: "Mặc định",
    active: true,
    config: DEFAULT_HERO,
  };
}

// Existing DBs may store a single config object instead of a preset list.
// Convert it to a single active preset so data is never lost.
function parseStored(value: string): HeroPreset[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (
    Array.isArray(parsed) &&
    parsed.filter(
      (p): p is HeroPreset =>
        !!p &&
        typeof p === "object" &&
        typeof (p as HeroPreset).id === "string" &&
        typeof (p as HeroPreset).name === "string"
    ).length === parsed.length
  ) {
    return parsed;
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as { template?: unknown }).template === "string"
  ) {
    return [
      {
        id: "default",
        name: "Mặc định",
        active: true,
        config: deepMerge<HeroConfig>(DEFAULT_HERO, parsed),
      },
    ];
  }
  return null;
}

const TEMPLATE_ALIASES: Record<string, HeroTemplate | undefined> = {
  "image-slider": "hero-text",
  image: "hero-text",
};

// Old presets may reference the removed image templates (or an unknown value);
// map anything unexpected back to the default content style.
function normalize(presets: HeroPreset[]): HeroPreset[] {
  const list = presets.length > 0 ? presets : [defaultPreset()];
  if (!list.some((p) => p.active)) {
    list[0] = { ...list[0], active: true };
  }
  return list.map((p) => {
    const template =
      TEMPLATE_ALIASES[p.config?.template] ??
      (["hero-text", "hero-center", "hero-glow"].includes(
        p.config?.template as string
      )
        ? (p.config.template as HeroTemplate)
        : "hero-text");
    return {
      ...p,
      config: deepMerge<HeroConfig>(DEFAULT_HERO, {
        template,
        heroText: p.config?.heroText ?? {},
      }),
    };
  });
}

export function getHeroPresets(): HeroPreset[] {
  const row = db
    .select()
    .from(settings)
    .where(eq(settings.key, STORAGE_KEY))
    .get();
  if (!row || !row.value) return [defaultPreset()];
  return normalize(parseStored(row.value) ?? [defaultPreset()]);
}

export function saveHeroPresets(presets: HeroPreset[]): void {
  const list = normalize(presets);
  db.insert(settings)
    .values({ key: STORAGE_KEY, value: JSON.stringify(list) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: JSON.stringify(list) },
    })
    .run();
}

export function getHeroConfig(): HeroConfig {
  const presets = getHeroPresets();
  return (presets.find((p) => p.active) ?? presets[0]).config;
}