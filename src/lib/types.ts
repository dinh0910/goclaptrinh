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
  published?: boolean;
  publishedAt?: string;
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

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  level: string;
  price: number;
  category: string;
  tags: string[];
  published: boolean;
  featured: boolean;
  duration: string;
  lessonCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLevel {
  id: number;
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  sortOrder: number;
}
