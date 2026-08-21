export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  author: string;
  image?: string;
  content: string;
  readingTime: string;
  featured?: boolean;
}

export interface Category {
  name: string;
  slug: string;
  description: string;
  count: number;
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
