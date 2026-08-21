import { SiteConfig } from "./types";

export const siteConfig: SiteConfig = {
  name: "Góc Lập Trình",
  title: "Góc Lập Trình - Chia sẻ kiến thức Lập trình & CNTT",
  description:
    "Blog chia sẻ kiến thức lập trình, công nghệ thông tin. Hướng dẫn học lập trình từ cơ bản đến nâng cao với các ngôn ngữ phổ biến như JavaScript, Python, TypeScript, React, Node.js và nhiều hơn nữa.",
  url: "https://goclaptrinh.io.vn",
  locale: "vi_VN",
  author: "Góc Lập Trình",
  socialLinks: {
    github: "https://github.com/goclaptrinh",
    facebook: "https://facebook.com/goclaptrinh",
  },
};

export const CATEGORIES = [
  {
    name: "JavaScript",
    slug: "javascript",
    description: "Kiến thức và thủ thuật JavaScript",
  },
  {
    name: "TypeScript",
    slug: "typescript",
    description: "Học TypeScript từ cơ bản đến nâng cao",
  },
  {
    name: "React",
    slug: "react",
    description: "Xây dựng UI với React",
  },
  {
    name: "Next.js",
    slug: "nextjs",
    description: "Framework React full-stack",
  },
  {
    name: "Node.js",
    slug: "nodejs",
    description: "Phát triển Backend với Node.js",
  },
  {
    name: "Python",
    slug: "python",
    description: "Lập trình Python đa năng",
  },
  {
    name: "DevOps",
    slug: "devops",
    description: "CI/CD, Docker, Cloud",
  },
  {
    name: "Cơ bản",
    slug: "co-ban",
    description: "Kiến thức nền tảng lập trình",
  },
];

export const POSTS_PER_PAGE = 6;
