import Link from "next/link";

const CODE_LINES = [
  { indent: 0, tokens: [{ text: "const ", color: "text-purple-600 dark:text-purple-400" }, { text: "goclaptrinh", color: "text-sky-600 dark:text-sky-300" }, { text: " = {", color: "text-slate-400 dark:text-slate-400" }] },
  { indent: 1, tokens: [{ text: "name", color: "text-emerald-600 dark:text-emerald-400" }, { text: ": ", color: "text-slate-400 dark:text-slate-400" }, { text: '"Góc Lập Trình"', color: "text-amber-600 dark:text-amber-300" }, { text: ",", color: "text-slate-400 dark:text-slate-400" }] },
  { indent: 1, tokens: [{ text: "mission", color: "text-emerald-600 dark:text-emerald-400" }, { text: ": ", color: "text-slate-400 dark:text-slate-400" }, { text: '"Chia sẻ kiến thức"', color: "text-amber-600 dark:text-amber-300" }, { text: ",", color: "text-slate-400 dark:text-slate-400" }] },
  { indent: 1, tokens: [{ text: "stack", color: "text-emerald-600 dark:text-emerald-400" }, { text: ": [", color: "text-slate-400 dark:text-slate-400" }, { text: '"JS"', color: "text-amber-600 dark:text-amber-300" }, { text: ", ", color: "text-slate-400 dark:text-slate-400" }, { text: '"TS"', color: "text-amber-600 dark:text-amber-300" }, { text: ", ", color: "text-slate-400 dark:text-slate-400" }, { text: '"React"', color: "text-amber-600 dark:text-amber-300" }, { text: "],", color: "text-slate-400 dark:text-slate-400" }] },
  { indent: 1, tokens: [{ text: "openSource", color: "text-emerald-600 dark:text-emerald-400" }, { text: ": ", color: "text-slate-400 dark:text-slate-400" }, { text: "true", color: "text-orange-500 dark:text-orange-400" }, { text: ",", color: "text-slate-400 dark:text-slate-400" }] },
  { indent: 0, tokens: [{ text: "};", color: "text-slate-400 dark:text-slate-400" }] },
];

const TECH_STACK = [
  { name: "JavaScript", color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-400/10 dark:text-yellow-400 dark:border-yellow-400/20", icon: "JS" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-400/10 dark:text-blue-400 dark:border-blue-400/20", icon: "TS" },
  { name: "React", color: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/10 dark:text-cyan-400 dark:border-cyan-400/20", icon: "R" },
  { name: "Next.js", color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-200/10 dark:text-slate-200 dark:border-slate-200/20", icon: "N" },
  { name: "Node.js", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-400/10 dark:text-green-400 dark:border-green-400/20", icon: "N" },
  { name: "Python", color: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-400/10 dark:text-sky-400 dark:border-sky-400/20", icon: "P" },
];

const STATS = [
  { value: "100+", label: "Bài viết" },
  { value: "8", label: "Chủ đề" },
  { value: "5K+", label: "Độc giả" },
];

export default function HeroBanner() {
  return (
    <section className="relative min-h-[600px] lg:min-h-[680px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Mesh gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/15 dark:bg-blue-600/20 blur-[120px] animate-hero-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-400/10 dark:bg-violet-600/15 blur-[100px] animate-hero-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/10 blur-[100px] animate-hero-pulse" style={{ animationDelay: "4s" }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />

        {/* Diagonal accent lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.04]" preserveAspectRatio="none">
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="currentColor" className="text-gray-900 dark:text-white" strokeWidth="1" />
          <line x1="20%" y1="100%" x2="100%" y2="20%" stroke="currentColor" className="text-gray-900 dark:text-white" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Content */}
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">Blog chia sẻ kiến thức CNTT</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              Nơi học{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-shift">
                  lập trình
                </span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-500/15 dark:bg-blue-500/20 rounded-sm -z-0" />
              </span>{" "}
              theo cách của bạn
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-gray-600 dark:text-slate-400 leading-relaxed max-w-lg">
              Từ cơ bản đến nâng cao. Hướng dẫn thực chiến với JavaScript,
              TypeScript, React, Next.js, Python, DevOps và nhiều công nghệ khác.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/blog"
                className="group relative inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30"
              >
                Khám phá bài viết
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all duration-200"
              >
                Giới thiệu
              </Link>
            </div>

            {/* Tech Stack Badges */}
            <div className="mt-10 flex flex-wrap gap-2">
              {TECH_STACK.map((tech) => (
                <span
                  key={tech.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border backdrop-blur-sm ${tech.color}`}
                >
                  <span className="w-5 h-5 flex items-center justify-center rounded bg-black/5 dark:bg-white/10 text-[10px] font-bold">
                    {tech.icon}
                  </span>
                  {tech.name}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-10 flex items-center gap-8">
              {STATS.map((stat, i) => (
                <div key={stat.label} className="flex items-center gap-8">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-sm text-gray-500 dark:text-slate-500">{stat.label}</p>
                  </div>
                  {i < STATS.length - 1 && (
                    <div className="w-px h-10 bg-gray-300 dark:bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right - Code Editor + Banner */}
          <div className="relative hidden lg:block">
            {/* Code Editor Window */}
            <div className="animate-hero-float">
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl shadow-gray-200 dark:shadow-black/50">
                {/* Title Bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-800/80 border-b border-gray-200 dark:border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-gray-200 dark:bg-slate-700/50 text-xs text-gray-500 dark:text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                      homepage.ts
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-5 font-mono text-sm leading-6 bg-gray-50 dark:bg-slate-900/60">
                  {CODE_LINES.map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-8 text-right text-gray-300 dark:text-slate-600 select-none mr-4 text-xs leading-6">
                        {i + 1}
                      </span>
                      <span style={{ paddingLeft: `${line.indent * 1.5}rem` }}>
                        {line.tokens.map((token, j) => (
                          <span key={j} className={token.color}>
                            {token.text}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                  <div className="flex mt-0.5">
                    <span className="w-8 text-right text-gray-300 dark:text-slate-600 select-none mr-4 text-xs leading-6">
                      7
                    </span>
                    <span className="w-0.5 h-5 bg-blue-500 dark:bg-blue-400 animate-typing-cursor" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge - Top Right */}
            <div className="absolute -top-4 -right-4 animate-hero-float-delayed">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 backdrop-blur-sm shadow-lg shadow-blue-500/20 border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-sm font-semibold text-white">Học miễn phí</span>
              </div>
            </div>

            {/* Floating Badge - Bottom Left */}
            <div className="absolute -bottom-3 left-8 animate-hero-float-delayed" style={{ animationDelay: "3s" }}>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 backdrop-blur-sm shadow-lg border border-gray-200 dark:border-white/10">
                <span className="text-lg">🚀</span>
                <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Cập nhật hàng tuần</span>
              </div>
            </div>

            {/* Banner Image Overlay */}
            <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
              <div className="w-full h-full bg-gradient-to-br from-blue-200/30 to-violet-200/30 dark:from-blue-600/20 dark:to-violet-600/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave/gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-950" />
    </section>
  );
}
