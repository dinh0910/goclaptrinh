export type HeroTemplate = "hero-text" | "hero-center" | "hero-glow";

export interface HeroPreset {
  id: string;
  name: string;
  active: boolean;
  config: HeroConfig;
}

export interface HeroConfig {
  template: HeroTemplate;
  heroText: {
    badge: string;
    heading: string;
    highlight: string;
    headingSuffix: string;
    subtitle: string;
    primaryText: string;
    primaryLink: string;
    secondaryText: string;
    secondaryLink: string;
    code: {
      title: string;
      lines: string[];
    };
  };
}

export const DEFAULT_HERO: HeroConfig = {
  template: "hero-text",
  heroText: {
    badge: "Blog chia sẻ kiến thức CNTT",
    heading: "Nơi học",
    highlight: "lập trình",
    headingSuffix: "theo cách của bạn",
    subtitle:
      "Từ cơ bản đến nâng cao. Hướng dẫn thực chiến với JavaScript, TypeScript, React, Next.js, Python, DevOps và nhiều công nghệ khác.",
    primaryText: "Khám phá bài viết",
    primaryLink: "/blog",
    secondaryText: "Giới thiệu",
    secondaryLink: "/about",
    code: {
      title: "homepage.ts",
      lines: [
        "const goclaptrinh = {",
        '  name: "Góc Lập Trình",',
        '  mission: "Chia sẻ kiến thức",',
        '  stack: ["JS", "TS", "React"],',
        "  openSource: true,",
        "};",
      ],
    },
  },
};

export function emptyHero(): HeroConfig {
  return {
    template: "hero-text",
    heroText: {
      badge: "",
      heading: "",
      highlight: "",
      headingSuffix: "",
      subtitle: "",
      primaryText: "",
      primaryLink: "",
      secondaryText: "",
      secondaryLink: "",
      code: {
        title: "",
        lines: [""],
      },
    },
  };
}

export function deepMerge<T>(base: T, override: unknown): T {
  if (!override || typeof override !== "object") return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(override as Record<string, unknown>)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      (base as Record<string, unknown>)[k] &&
      typeof (base as Record<string, unknown>)[k] === "object"
    ) {
      out[k] = deepMerge((base as Record<string, unknown>)[k], v);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}