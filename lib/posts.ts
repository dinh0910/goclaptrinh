import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { readingMinutes } from "@/lib/utils";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  author: string;
  coverImage?: string;
  featured?: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & { content: string };

function parsePost(fileName: string): Post {
  const slug = fileName.replace(/\.mdx$/, "");
  const source = fs.readFileSync(path.join(postsDirectory, fileName), "utf8");
  const { data, content } = matter(source);
  const required = ["title", "description", "excerpt", "date", "category", "tags", "author"];
  for (const field of required) {
    if (data[field] === undefined) {
      throw new Error(`Missing frontmatter field '${field}' in ${fileName}`);
    }
  }
  return {
    slug,
    title: String(data.title),
    description: String(data.description),
    excerpt: String(data.excerpt),
    date: String(data.date),
    category: String(data.category),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author: String(data.author),
    coverImage: data.coverImage ? String(data.coverImage) : undefined,
    featured: data.featured === true,
    readingMinutes: readingMinutes(content),
    content,
  };
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((f) => f.endsWith(".mdx"))
    .map(parsePost)
    .map(({ content: _content, ...meta }) => meta)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getFeaturedPosts(limit = 3): PostMeta[] {
  const all = getAllPosts();
  const featured = all.filter((p) => p.featured);
  return featured.length >= limit ? featured.slice(0, limit) : all.slice(0, limit);
}

export function getPostBySlug(slug: string): Post | null {
  const fileName = `${slug}.mdx`;
  if (!fs.existsSync(path.join(postsDirectory, fileName))) return null;
  return parsePost(fileName);
}

export function getPostHeadings(content: string) {
  return [...content.matchAll(/^#{2,3}\s+(.+)$/gm)].map((match) => {
    const level = match[0].startsWith("###") ? 3 : 2;
    const title = match[1].trim();
    const id = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return { id, title, level };
  });
}

export const POSTS_PER_PAGE = 9;
