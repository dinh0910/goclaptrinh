export const navHrefs = {
  home: "/",
  blog: "/blog",
  til: "/til",
  category: "/danh-muc",
  tag: "/tag",
  search: "/tim-kiem",
} as const;

export function blogPostHref(slug: string) {
  return `${navHrefs.blog}/${slug}`;
}

export function categoryHref(category: string) {
  return `${navHrefs.category}/${encodeURIComponent(category)}`;
}

export function tagHref(tag: string) {
  return `${navHrefs.tag}/${encodeURIComponent(tag)}`;
}

/** Top-level navigation items */
export const navItems = [
  { key: "blog",    label: "Blog",       href: navHrefs.blog },
  { key: "til",     label: "TIL",        href: navHrefs.til },
  { key: "search",  label: "Tìm kiếm",  href: navHrefs.search },
] as const;

/** Blog categories */
export const categoryIds = [
  "web-dev",
  "backend",
  "devops",
  "ai",
  "career",
  "til",
] as const;

export type CategoryId = (typeof categoryIds)[number];

export const categoryLabels: Record<CategoryId, string> = {
  "web-dev":  "Web Dev",
  backend:    "Backend",
  devops:     "DevOps",
  ai:         "AI / ML",
  career:     "Career",
  til:        "TIL",
};

/** Affiliate partner presets */
export const affiliatePartners = {
  vultr: {
    name: "Vultr",
    description: "VPS hiệu năng cao, giá từ $2.50/tháng. Nhận $100 credit miễn phí.",
    href: "https://www.vultr.com/?ref=goclaptrinh",
    cta: "Dùng thử miễn phí",
    badge: "Khuyên dùng",
  },
  namecheap: {
    name: "Namecheap",
    description: "Tên miền và hosting uy tín, giá tốt nhất thị trường.",
    href: "https://www.namecheap.com/?aff=goclaptrinh",
    cta: "Đăng ký ngay",
    badge: "Đối tác",
  },
  vercel: {
    name: "Vercel",
    description: "Deploy Next.js cực nhanh, free tier rộng rãi cho cá nhân.",
    href: "https://vercel.com",
    cta: "Deploy miễn phí",
    badge: "Miễn phí",
  },
} as const;

export type AffiliatePartnerId = keyof typeof affiliatePartners;
