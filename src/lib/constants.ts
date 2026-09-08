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

export interface CategoryIconOption {
  icon: string;
  label: string;
  keywords: string[];
}

export interface CategoryIconGroup {
  group: string;
  icons: CategoryIconOption[];
}

export const CATEGORY_ICON_GROUPS: CategoryIconGroup[] = [
  {
    group: "Ngôn ngữ lập trình",
    icons: [
      { icon: "⚡", label: "JavaScript", keywords: ["js", "es6"] },
      { icon: "🔷", label: "TypeScript", keywords: ["ts", "js"] },
      { icon: "🐍", label: "Python", keywords: ["py", "django"] },
      { icon: "🐘", label: "PHP", keywords: ["web"] },
      { icon: "☕", label: "Java", keywords: ["coffee", "jvm", "kotlin"] },
      { icon: "🦀", label: "Rust", keywords: ["wasm"] },
      { icon: "💎", label: "Ruby", keywords: ["gem", "rails"] },
      { icon: "🐹", label: "Go", keywords: ["golang", "gopher"] },
      { icon: "🐚", label: "Shell", keywords: ["bash", "zsh", "terminal", "linux"] },
      { icon: "🕹️", label: "C# / .NET", keywords: ["csharp", "dotnet", "unity"] },
      { icon: "🧮", label: "C / C++", keywords: ["c", "cpp", "embedded"] },
      { icon: "⚛️", label: "React", keywords: ["react", "hook"] },
      { icon: "▲", label: "Next.js", keywords: ["next", "nextjs"] },
      { icon: "🟢", label: "Node.js", keywords: ["node", "express", "backend"] },
      { icon: "🌿", label: "Vue.js", keywords: ["vue", "nuxt"] },
      { icon: "🕸️", label: "Web / HTML / CSS", keywords: ["web", "html", "css", "frontend"] },
    ],
  },
  {
    group: "Công nghệ & Công cụ",
    icons: [
      { icon: "🤖", label: "AI / ML", keywords: ["ai", "ml", "machine", "robot", "deep"] },
      { icon: "🧪", label: "Testing", keywords: ["test", "qa", "tdd", "quality"] },
      { icon: "🔒", label: "Bảo mật", keywords: ["security", "bao mat", "auth"] },
      { icon: "🐳", label: "Docker", keywords: ["container", "kubernetes", "k8s", "whale"] },
      { icon: "☁️", label: "Cloud", keywords: ["aws", "azure", "gcp"] },
      { icon: "🗄️", label: "Database", keywords: ["sql", "nosql", "db", "redis", "mongodb"] },
      { icon: "⚙️", label: "DevOps", keywords: ["ci", "cd", "deploy"] },
      { icon: "🚀", label: "Triển khai", keywords: ["deploy", "release", "launch", "phat hanh"] },
      { icon: "🔗", label: "API / Tích hợp", keywords: ["api", "integration", "tich hop", "rest", "graphql"] },
      { icon: "🧩", label: "Component / Module", keywords: ["module", "component", "plugin"] },
      { icon: "🏗️", label: "Kiến trúc", keywords: ["architecture", "pattern", "design", "kien truc"] },
      { icon: "🧬", label: "Khoa học dữ liệu", keywords: ["data", "ml", "khoa hoc du lieu"] },
      { icon: "🔭", label: "Giám sát", keywords: ["monitoring", "observability", "log", "giam sat"] },
      { icon: "📈", label: "Hiệu suất", keywords: ["performance", "speed", "hieu suat"] },
      { icon: "📊", label: "Phân tích", keywords: ["analytics", "report", "phan tich", "thong ke"] },
      { icon: "📡", label: "Truyền thông", keywords: ["network", "signal", "truyen thong"] },
      { icon: "🔧", label: "Công cụ", keywords: ["tool", "cong cu", "cli"] },
      { icon: "🛠️", label: "Xây dựng", keywords: ["build", "construct", "xay dung"] },
      { icon: "📦", label: "Thư viện / Package", keywords: ["package", "library", "thu vien", "npm"] },
    ],
  },
  {
    group: "Chủ đề chung",
    icons: [
      { icon: "💻", label: "Lập trình", keywords: ["code", "lap trinh", "dev"] },
      { icon: "🖥️", label: "Máy tính", keywords: ["computer", "desktop", "pc", "may tinh"] },
      { icon: "📝", label: "Nội dung", keywords: ["content", "write", "noi dung"] },
      { icon: "📚", label: "Học tập", keywords: ["learn", "study", "hoc", "giai thich"] },
      { icon: "🎨", label: "Thiết kế", keywords: ["design", "ui", "ux", "thiet ke"] },
      { icon: "🌐", label: "Internet", keywords: ["web", "internet", "mang"] },
      { icon: "📱", label: "Di động", keywords: ["mobile", "app", "android", "ios"] },
      { icon: "🐧", label: "Linux / Mã nguồn mở", keywords: ["linux", "open source", "ubuntu", "ma nguon mo"] },
      { icon: "🧠", label: "Tư duy", keywords: ["logic", "thinking", "tu duy", "mind"] },
      { icon: "💡", label: "Ý tưởng", keywords: ["idea", "tip", "y tuong", "meo"] },
      { icon: "🎯", label: "Mục tiêu", keywords: ["goal", "target", "muc tieu"] },
      { icon: "🧾", label: "Tài liệu", keywords: ["docs", "document", "tai lieu"] },
      { icon: "🔬", label: "Nghiên cứu", keywords: ["research", "science", "nghien cuu"] },
      { icon: "⚖️", label: "Best practice", keywords: ["standard", "convention", "quy tac", "tieu chuan"] },
      { icon: "🎬", label: "Video / Khóa học", keywords: ["video", "course", "khoa hoc"] },
      { icon: "🎮", label: "Game", keywords: ["game", "play", "tro choi"] },
    ],
  },
];

export const CATEGORY_ICON_OPTIONS = CATEGORY_ICON_GROUPS.flatMap(
  (g) => g.icons
);
export const DEFAULT_CATEGORY_ICON = "📁";
