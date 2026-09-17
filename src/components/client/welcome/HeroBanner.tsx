"use client";

import Link from "next/link";
import { DEFAULT_HERO, type HeroConfig } from "@/lib/hero-config";

interface Token {
  text: string;
  color: string;
}

const STRING_RE = /^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/;
const KEY_RE = /^([A-Za-z_$][\w$]*)(\s*:)/;
const WORD_RE = /^[A-Za-z_$][\w$]*/;
const KEYWORDS = [
  "const",
  "let",
  "var",
  "return",
  "function",
  "if",
  "else",
  "for",
  "while",
  "import",
  "export",
  "from",
  "new",
  "class",
  "async",
  "await",
];
const LITERALS = ["true", "false", "null", "undefined"];

// Lightweight syntax highlighting for the hero code block. Each line of plain
// text is tokenized into decorated spans so edited content stays readable.
function highlightLine(line: string): Token[] {
  const tokens: Token[] = [];
  let rest = line;

  while (rest.length > 0) {
    if (rest.startsWith("//")) {
      tokens.push({
        text: rest,
        color: "text-slate-400 italic dark:text-slate-500",
      });
      break;
    }

    const str = rest.match(STRING_RE);
    if (str) {
      tokens.push({
        text: str[1],
        color: "text-amber-600 dark:text-amber-300",
      });
      rest = rest.slice(str[1].length);
      continue;
    }

    const key = rest.match(KEY_RE);
    if (key) {
      tokens.push({
        text: key[1],
        color: "text-emerald-600 dark:text-emerald-400",
      });
      rest = rest.slice(key[1].length);
      continue;
    }

    const num = rest.match(/^\d[\d_]*(\.\d+)?/);
    if (num) {
      tokens.push({
        text: num[0],
        color: "text-orange-500 dark:text-orange-400",
      });
      rest = rest.slice(num[0].length);
      continue;
    }

    const word = rest.match(WORD_RE);
    if (word) {
      const w = word[0];
      const color = LITERALS.includes(w)
        ? "text-orange-500 dark:text-orange-400"
        : KEYWORDS.includes(w)
        ? "text-purple-600 dark:text-purple-400"
        : "text-sky-600 dark:text-sky-300";
      tokens.push({ text: w, color });
      rest = rest.slice(w.length);
      continue;
    }

    // Whitespace and punctuation
    tokens.push({
      text: rest[0],
      color: "text-slate-400 dark:text-slate-400",
    });
    rest = rest.slice(1);
  }

  return tokens;
}

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

function HeroText({ hero }: { hero: HeroConfig["heroText"] }) {
  return (
    <div className="relative min-h-[600px] lg:min-h-[680px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-slate-950">
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
              <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">
                {hero.badge}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
              {hero.heading}{" "}
              {hero.highlight && (
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-shift">
                    {hero.highlight}
                  </span>
                  <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-500/15 dark:bg-blue-500/20 rounded-sm -z-0" />
                </span>
              )}{" "}
              {hero.headingSuffix}
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg text-gray-600 dark:text-slate-400 leading-relaxed max-w-lg">
              {hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {hero.primaryText && (
                <Link
                  href={hero.primaryLink || "/blog"}
                  className="group relative inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30"
                >
                  {hero.primaryText}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              )}
              {hero.secondaryText && (
                <Link
                  href={hero.secondaryLink || "/about"}
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all duration-200"
                >
                  {hero.secondaryText}
                </Link>
              )}
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
                      {hero.code.title}
                    </div>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-5 font-mono text-sm leading-6 bg-gray-50 dark:bg-slate-900/60">
                  {hero.code.lines.map((line, i) => (
                    <div key={i} className="flex">
                      <span className="w-8 text-right text-gray-300 dark:text-slate-600 select-none mr-4 text-xs leading-6">
                        {i + 1}
                      </span>
                      <span className="whitespace-pre">
                        {highlightLine(line).map((token, j) => (
                          <span key={j} className={token.color}>
                            {token.text}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                  <div className="flex mt-0.5">
                    <span className="w-8 text-right text-gray-300 dark:text-slate-600 select-none mr-4 text-xs leading-6">
                      {hero.code.lines.length + 1}
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
    </div>
  );
}

function HeroCenter({ hero }: { hero: HeroConfig["heroText"] }) {
  return (
    <section className="relative min-h-[600px] lg:min-h-[680px] overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-gray-900 dark:to-slate-950 flex items-center">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/15 dark:bg-blue-600/20 blur-[120px] animate-hero-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-400/10 dark:bg-violet-600/15 blur-[100px] animate-hero-pulse" style={{ animationDelay: "2s" }} />
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">
            {hero.badge}
          </span>
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-[1.1] tracking-tight">
          {hero.heading}{" "}
          {hero.highlight && (
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-600 dark:from-blue-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-shift">
                {hero.highlight}
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-500/15 dark:bg-blue-500/20 rounded-sm -z-0" />
            </span>
          )}{" "}
          {hero.headingSuffix}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-gray-600 dark:text-slate-400 leading-relaxed mx-auto max-w-2xl">
          {hero.subtitle}
        </p>

        {/* CTA */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {hero.primaryText && (
            <Link
              href={hero.primaryLink || "/blog"}
              className="group relative inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/20 dark:shadow-blue-600/30"
            >
              {hero.primaryText}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
          {hero.secondaryText && (
            <Link
              href={hero.secondaryLink || "/about"}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-white/10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all duration-200"
            >
              {hero.secondaryText}
            </Link>
          )}
        </div>

        {/* Tech stack */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
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
        <div className="mt-10 flex items-center justify-center gap-8">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-8">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-slate-500 mt-0.5">{stat.label}</p>
              </div>
              {i < STATS.length - 1 && (
                <div className="w-px h-10 bg-gray-300 dark:bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 to-transparent dark:from-gray-950" />
    </section>
  );
}

function HeroGlow({ hero }: { hero: HeroConfig["heroText"] }) {
  return (
    <section className="relative min-h-[600px] lg:min-h-[680px] overflow-hidden bg-slate-950 flex items-center">
      {/* Animated glow background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-blue-600/25 blur-[140px] animate-hero-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[500px] rounded-full bg-violet-600/20 blur-[130px] animate-hero-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px] animate-hero-pulse" style={{ animationDelay: "4s" }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm text-slate-200 font-medium">{hero.badge}</span>
        </div>

        {/* Heading */}
        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
          {hero.heading}{" "}
          {hero.highlight && (
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-shift">
                {hero.highlight}
              </span>
              <span className="absolute bottom-1 left-0 right-0 h-3 bg-blue-500/25 rounded-sm -z-0 blur-[2px]" />
            </span>
          )}{" "}
          {hero.headingSuffix}
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg text-slate-300 leading-relaxed mx-auto max-w-2xl">
          {hero.subtitle}
        </p>

        {/* CTA */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          {hero.primaryText && (
            <Link
              href={hero.primaryLink || "/blog"}
              className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl shadow-lg shadow-blue-600/40 hover:shadow-xl hover:shadow-violet-600/40 hover:brightness-110 transition-all duration-200"
            >
              {hero.primaryText}
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          )}
          {hero.secondaryText && (
            <Link
              href={hero.secondaryLink || "/about"}
              className="inline-flex items-center gap-2 px-7 py-3.5 text-base font-semibold text-white border border-white/15 rounded-xl hover:bg-white/5 hover:border-white/25 transition-all duration-200"
            >
              {hero.secondaryText}
            </Link>
          )}
        </div>

        {/* Tech stack */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
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
      </div>

      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 to-transparent" />
    </section>
  );
}

export default function HeroBanner({ hero }: { hero?: HeroConfig }) {
  const config = hero ?? DEFAULT_HERO;

  switch (config.template) {
    case "hero-center":
      return <HeroCenter hero={config.heroText} />;
    case "hero-glow":
      return <HeroGlow hero={config.heroText} />;
    case "hero-text":
    default:
      return <HeroText hero={config.heroText} />;
  }
}