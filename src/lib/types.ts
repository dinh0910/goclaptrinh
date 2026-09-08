export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  categoryName?: string;
  categoryColor?: string;
  tags: string[];
  author: string;
  image?: string;
  content: string;
  readingTime: string;
  featured?: boolean;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  count: number;
  icon?: string;
  color?: string;
}

export interface SiteConfig {
  name: string;
  title: string;
  description: string;
  url: string;
  locale: string;
  author: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}
