import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "blog.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const categories = ["javascript", "typescript", "react", "nextjs", "nodejs", "python", "devops", "co-ban"];
const tags = ["tutorial", "tips", "beginner", "advanced", "best-practice", "performance", "async", "hooks", "api", "docker", "git", "css", "html", "database", "testing"];

const titles = [
  "Promise và Async/Await trong JavaScript",
  "JavaScript Closures là gì?",
  "Event Loop và Non-blocking I/O",
  "Arrow Function vs Function Declaration",
  "Template Literal nâng cao",
  "Destructuring trong ES6+",
  "Spread và Rest Operator",
  "Array methods: map, filter, reduce",
  "Optional Chaining và Nullish Coalescing",
  "Proxy và Reflect API",
  "Generators trong JavaScript",
  "Iterators và For...of",
  "Modules: Import/Export nâng cao",
  "WeakMap và WeakSet khi nào dùng",
  "Type Narrowing trong TypeScript",
  "Utility Types phổ biến: Partial, Pick, Omit",
  "Generics trong TypeScript",
  "Type Guards tự tạo",
  "Mapped Types và Conditional Types",
  "Declaration Files (.d.ts) đúng cách",
  "React useRef Hook hướng dẫn chi tiết",
  "useMemo và useCallback khi nào dùng",
  "Custom Hook pattern",
  "React Context và Provider",
  "Error Boundary trong React",
  "Suspense và Lazy Loading",
  "Server Components trong Next.js 14",
  "App Router vs Pages Router",
  "Metadata API SEO trong Next.js",
  "Server Actions trong Next.js",
  "Middleware trong Next.js",
  "Parallel Routes và Intercepting Routes",
  "Streaming SSR với Next.js",
  "Authentication trong Next.js",
  "Node.js Streams hướng dẫn",
  "Worker Threads trong Node.js",
  "Microservices với Node.js",
  "Redis caching strategies",
  "Docker Compose cho development",
  "Kubernetes basics cho developer",
  "Terraform cơ bản cho DevOps",
  "GitHub Actions CI/CD pipeline",
];

const now = new Date().toISOString();
const baseDate = new Date("2025-01-15");

const insert = sqlite.prepare(`
  INSERT OR IGNORE INTO posts (slug, title, description, date, category, tags, author, content, raw_content, reading_time, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = sqlite.transaction((items: typeof titles) => {
  for (let i = 0; i < items.length; i++) {
    const title = items[i];
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const cat = categories[i % categories.length];
    const postTags = [tags[i % tags.length], tags[(i * 3 + 1) % tags.length]];
    const uniqueTags = [...new Set(postTags)];
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i * 3);
    const dateStr = date.toISOString().split("T")[0];
    const description = `Bài viết hướng dẫn ${title.toLowerCase()} từ cơ bản đến nâng cao, giúp bạn nắm vững kiến thức nền tảng.`;
    const readingTime = `${5 + (i % 8)} phút đọc`;
    const rawContent = `# ${title}\n\n${description}\n\n## Nội dung\n\nNội dung bài viết về ${title.toLowerCase()}.\n\n- Phần 1: Giới thiệu\n- Phần 2: Hướng dẫn chi tiết\n- Phần 3: Ví dụ thực tế\n- Phần 4: Kết luận`;
    const content = `<h1>${title}</h1><p>${description}</p><h2>Nội dung</h2><p>Nội dung bài viết về ${title.toLowerCase()}.</p>`;
    insert.run(slug, title, description, dateStr, cat, JSON.stringify(uniqueTags), "Góc Lập Trình", content, rawContent, readingTime, now, now);
  }
});

insertMany(titles);
console.log(`✓ Đã thêm ${titles.length} bài viết test`);

// Thêm categories test
const extraCategories = [
  { slug: "css", name: "CSS", description: "Thiết kế giao diện với CSS" },
  { slug: "html", name: "HTML", description: "Cấu trúc trang web với HTML" },
  { slug: "database", name: "Database", description: "Quản lý cơ sở dữ liệu" },
  { slug: "testing", name: "Testing", description: "Kiểm thử phần mềm" },
  { slug: "security", name: "Security", description: "An ninh mạng và bảo mật" },
  { slug: "mobile", name: "Mobile Dev", description: "Phát triển ứng dụng di động" },
  { slug: "ai-ml", name: "AI & ML", description: "Trí tuệ nhân tạo và học máy" },
  { slug: "cloud", name: "Cloud", description: "Điện toán đám mây AWS/GCP" },
];

const insertCat = sqlite.prepare("INSERT OR IGNORE INTO categories (slug, name, description) VALUES (?, ?, ?)");
for (const c of extraCategories) {
  insertCat.run(c.slug, c.name, c.description);
}
console.log(`✓ Đã thêm ${extraCategories.length} danh mục test`);

sqlite.close();
