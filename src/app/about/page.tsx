import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig, CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: `Tìm hiểu về ${siteConfig.name} - Blog chia sẻ kiến thức lập trình và công nghệ thông tin.`,
  openGraph: {
    title: `Giới thiệu | ${siteConfig.name}`,
    description: `Tìm hiểu về ${siteConfig.name}`,
    type: "website",
  },
  alternates: {
    canonical: `${siteConfig.url}/about`,
  },
};

const VALUES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    title: "Kiến thức thực chiến",
    description: "Mỗi bài viết đều đi kèm ví dụ code thực tế, giúp bạn áp dụng ngay vào dự án.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: "Cập nhật nhanh chóng",
    description: "Nội dung mới nhất về JavaScript, TypeScript, React, Next.js, Python, DevOps.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Cộng đồng",
    description: "Xây dựng cộng đồng lập trình viên chia sẻ, học hỏi và phát triển cùng nhau.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "Miễn phí & Open Source",
    description: "Tất cả nội dung đều miễn phí. Đóng góp từ cộng đồng luôn được chào đón.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const TEAM = [
  { name: "Developer", role: "Founder & Writer", initials: "D" },
  { name: "Designer", role: "UI/UX Designer", initials: "Ds" },
  { name: "Editor", role: "Content Editor", initials: "E" },
];

const TIMELINE = [
  { year: "2024", title: "Khởi đầu", description: "${siteConfig.name} ra đời với mục tiêu chia sẻ kiến thức lập trình miễn phí." },
  { year: "2025", title: "Phát triển", description: "Mở rộng thêm nhiều chủ đề: DevOps, Python, System Design." },
  { year: "2026", title: "Mở rộng", description: "Cộng đồng lớn mạnh, hàng nghìn độc giả tin tưởng mỗi ngày." },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-[100px] animate-about-glow" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-400/10 dark:bg-violet-500/10 rounded-full blur-[80px] animate-about-glow" style={{ animationDelay: "2s" }} />
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm mb-8">
              <span className="text-sm text-gray-600 dark:text-slate-300">Về chúng tôi</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Chia sẻ kiến thức,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                kiến tạo tương lai
              </span>
            </h1>

            <p className="mt-6 text-lg text-gray-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
              {siteConfig.name} là nơi mọi lập trình viên có thể tìm thấy kiến thức
              giá trị, từ cơ bản đến nâng cao, hoàn toàn miễn phí.
            </p>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">100+</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">Bài viết</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">8</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">Chủ đề</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">5K+</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">Độc giả</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-950" />
      </section>

      {/* Values Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Tại sao chọn {siteConfig.name}?
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Chúng tôi tin rằng kiến thức lập trình nên được chia sẻ miễn phí
            và dễ tiếp cận với mọi người.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((value) => (
            <div
              key={value.title}
              className="group relative p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${value.gradient} text-white mb-5 shadow-lg`}>
                {value.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {value.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {value.description}
              </p>
              {/* Subtle gradient on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 pointer-events-none`} />
            </div>
          ))}
        </div>
      </section>

      {/* Topics Section */}
      <section className="bg-gray-100 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Chủ đề chúng tôi viết
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Phủ sóng đầy đủ các công nghệ và kiến thức CNTT
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group relative p-5 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-600"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {cat.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Đội ngũ
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Những người đam mê công nghệ đứng sau {siteConfig.name}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="group text-center p-8 rounded-2xl bg-white border border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
                <span className="text-2xl font-bold text-white">{member.initials}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {member.name}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {member.role}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-gray-100 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Hành trình
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Những cột mốc quan trọng của {siteConfig.name}
            </p>
          </div>

          <div className="relative max-w-2xl mx-auto">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-violet-500 to-purple-500" />

            {TIMELINE.map((item, i) => (
              <div
                key={item.year}
                className={`relative flex items-start gap-8 mb-12 ${
                  i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                }`}
              >
                {/* Dot */}
                <div className="absolute left-4 sm:left-1/2 w-3 h-3 -translate-x-1.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full ring-4 ring-gray-100 dark:ring-gray-950 z-10" />

                {/* Content */}
                <div className={`flex-1 pl-12 sm:pl-0 ${i % 2 === 0 ? "sm:text-right sm:pr-12" : "sm:text-left sm:pl-12"}`}>
                  <span className="inline-block px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-full dark:text-blue-400 dark:bg-blue-950 mb-3">
                    {item.year}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </div>

                {/* Spacer for other side */}
                <div className="hidden sm:block flex-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-blue-700" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="mt-4 text-blue-100 text-lg max-w-xl mx-auto">
            Khám phá hàng trăm bài viết chất lượng về lập trình và CNTT.
            Bắt đầu hành trình học tập của bạn ngay hôm nay.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-blue-700 bg-white rounded-xl hover:bg-blue-50 transition-colors shadow-lg"
            >
              Đọc blog ngay
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href={siteConfig.socialLinks.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white border-2 border-white/30 rounded-xl hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
