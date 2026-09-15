import { sqliteClient } from "./db";
import { describeDevice } from "./visitor";
import type { VisitorSignals } from "./visitor";

/**
 * Analytics library over the `page_views` table. All timestamps are stored as
 * UTC ISO strings; day grouping uses the UTC calendar date.
 */

export interface DeviceBreakdownItem {
  key: string;
  label: string;
  count: number;
}

export interface DayPoint {
  date: string;
  label: string;
  views: number;
  unique: number;
}

export interface TopPageItem {
  path: string;
  slug: string;
  title: string;
  views: number;
}

export interface AnalyticsData {
  rangeDays: number;
  start: string;
  end: string;
  totals: {
    views: number;
    uniqueVisitors: number;
    viewsToday: number;
    uniqueToday: number;
  };
  viewsByDay: DayPoint[];
  devices: {
    browsers: DeviceBreakdownItem[];
    os: DeviceBreakdownItem[];
    screens: DeviceBreakdownItem[];
  };
  topPages: TopPageItem[];
  topPosts: TopPageItem[];
  newsletter: {
    signups: number;
    active: number;
    unsubscribed: number;
    signupsByDay: DayPoint[];
  };
  welcome: {
    submissions: number;
    submissionsUnique: number;
    submissionsByDay: DayPoint[];
    conversionRate: number;
  };
}

export function recordPageView(input: {
  visitorId: string;
  path: string;
  referrer: string;
  ip: string;
  signals: Partial<VisitorSignals>;
  dedupeMinutes?: number;
}): { recorded: boolean } {
  const { visitorId, path, referrer, ip, signals } = input;
  const now = new Date().toISOString();

  // Skip obvious crawler/bot paths and empty paths.
  const p = (path || "").slice(0, 500);
  if (!p || p.startsWith("/api")) return { recorded: false };

  // Light dedupe: skip if the same visitor recorded this path recently.
  if (visitorId && input.dedupeMinutes !== 0) {
    const cutoff = new Date(
      Date.now() - (input.dedupeMinutes ?? 30) * 60_000
    ).toISOString();
    const recent = sqliteClient
      .prepare(
        "SELECT id FROM page_views WHERE visitor_id = ? AND path = ? AND created_at > ? LIMIT 1"
      )
      .get(visitorId, p, cutoff);
    if (recent) return { recorded: false };
  }

  sqliteClient
    .prepare(
      "INSERT INTO page_views (visitor_id, path, referrer, ip, signals, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(
      (visitorId || "").slice(0, 100),
      p,
      (referrer || "").slice(0, 500),
      (ip || "").slice(0, 64),
      JSON.stringify(signals || {}),
      now
    );
  return { recorded: true };
}

function dayLabel(dateStr: string): string {
  // ISO date -> "15/9" style label.
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function isDateStr(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())
  );
}

/** Generate a zero-filled series of calendar days from start to end (UTC). */
function buildDaySeries(start: string, end: string): DayPoint[] {
  const series: DayPoint[] = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 500) {
    series.push({ date: cur, label: dayLabel(cur), views: 0, unique: 0 });
    cur = addDays(cur, 1);
    guard++;
  }
  return series;
}

function mergeGrouped(
  series: DayPoint[],
  grouped: Array<{ date: string; views: number; unique: number }>
) {
  const byDate = new Map(grouped.map((g) => [g.date, g]));
  for (const point of series) {
    const g = byDate.get(point.date);
    if (g) {
      point.views = g.views;
      point.unique = g.unique;
    }
  }
  return series;
}

export interface AnalyticsQuery {
  /** Preset: last N days (1-366). Ignored when start/end are given. */
  days?: number;
  /** Custom inclusive range (YYYY-MM-DD). */
  start?: string;
  end?: string;
}

export function getAnalytics(query: AnalyticsQuery = {}): AnalyticsData {
  const today = todayStr();

  let start: string;
  let end: string;
  if (isDateStr(query.start) && isDateStr(query.end) && query.start <= query.end) {
    start = query.start;
    end = query.end;
  } else if (typeof query.days === "number" && Number.isFinite(query.days)) {
    const days = Math.min(Math.max(Math.floor(query.days), 1), 366);
    start = addDays(today, -(days - 1));
    end = today;
  } else {
    start = addDays(today, -29);
    end = today;
  }

  // created_at is a full UTC ISO timestamp; an exclusive upper bound of the
  // day after `end` keeps the whole end-day included.
  const endExcl = addDays(end, 1);
  const rangeDays =
    Math.round(
      (Date.UTC(+end.slice(0, 4), +end.slice(5, 7) - 1, +end.slice(8, 10)) -
        Date.UTC(+start.slice(0, 4), +start.slice(5, 7) - 1, +start.slice(8, 10))) /
        86_400_000
    ) + 1;

  const viewsByDayAll = sqliteClient
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date,
              count(*) AS views,
              count(DISTINCT visitor_id) AS "unique"
       FROM page_views
       WHERE created_at >= ? AND created_at < ?
       GROUP BY substr(created_at, 1, 10)`
    )
    .all(start, endExcl) as Array<{ views: number; unique: number; date: string }>;

  const viewsByDay = mergeGrouped(buildDaySeries(start, end), viewsByDayAll);

  const totalsRow = sqliteClient
    .prepare(
      `SELECT count(*) AS views,
              count(DISTINCT visitor_id) AS uniqueVisitors,
              sum(CASE WHEN substr(created_at,1,10) = ? THEN 1 ELSE 0 END) AS viewsToday,
              count(DISTINCT CASE WHEN substr(created_at,1,10) = ? THEN visitor_id END) AS uniqueToday
       FROM page_views
       WHERE created_at >= ? AND created_at < ?`
    )
    .get(today, today, start, endExcl) as {
    views: number;
    uniqueVisitors: number;
    viewsToday: number;
    uniqueToday: number;
  };

  // Device breakdown from stored signals.
  const deviceRows = sqliteClient
    .prepare("SELECT signals FROM page_views WHERE created_at >= ? AND created_at < ?")
    .all(start, endExcl) as Array<{ signals: string }>;

  const browsers = new Map<string, number>();
  const os = new Map<string, number>();
  const screens = new Map<string, number>();
  for (const row of deviceRows) {
    let signals: Partial<VisitorSignals> = {};
    try {
      const parsed = JSON.parse(row.signals || "{}");
      if (parsed && typeof parsed === "object") signals = parsed as Partial<VisitorSignals>;
    } catch {
      /* ignore */
    }
    const full: VisitorSignals = {
      ua: signals.ua ?? "",
      platform: signals.platform ?? "",
      lang: signals.lang ?? "",
      tz: signals.tz ?? "",
      screenW: signals.screenW ?? 0,
      screenH: signals.screenH ?? 0,
      dpr: signals.dpr ?? 0,
      touch: !!signals.touch,
    };
    const { browser, os: osName, screen } = describeDevice(full);
    const b = browser || "Khác";
    const o = osName || "Khác";
    browsers.set(b, (browsers.get(b) ?? 0) + 1);
    os.set(o, (os.get(o) ?? 0) + 1);
    if (screen) screens.set(screen, (screens.get(screen) ?? 0) + 1);
  }

  const deviceBars = (map: Map<string, number>) =>
    Array.from(map.entries())
      .map(([key, count]) => ({ key, label: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

  // Top pages/posts. Blog posts live at /blog/<slug>.
  const topRaw = sqliteClient
    .prepare(
      `SELECT path, count(*) AS views
       FROM page_views
       WHERE created_at >= ? AND created_at < ? AND path != ''
       GROUP BY path
       ORDER BY views DESC
       LIMIT 50`
    )
    .all(start, endExcl) as Array<{ path: string; views: number }>;

  const topPages: TopPageItem[] = topRaw.map((r) => {
    const slugMatch = r.path.match(/^\/blog\/([^/?#]+)/);
    return {
      path: r.path,
      slug: slugMatch ? decodeURIComponent(slugMatch[1]) : "",
      title: "",
      views: Number(r.views),
    };
  });

  const topPosts: TopPageItem[] = [];
  const slugs = topPages.map((p) => p.slug).filter(Boolean);
  if (slugs.length) {
    const placeholders = slugs.map(() => "?").join(",");
    const postRows = sqliteClient
      .prepare(`SELECT slug, title FROM posts WHERE slug IN (${placeholders})`)
      .all(...slugs) as Array<{ slug: string; title: string }>;
    const titleBySlug = new Map(postRows.map((r) => [r.slug, r.title]));
    for (const page of topPages) {
      if (page.slug && titleBySlug.has(page.slug)) {
        topPosts.push({ ...page, title: titleBySlug.get(page.slug) || page.slug });
      }
    }
  }
  topPosts.sort((a, b) => b.views - a.views);

  // Newsletter signups per day (only count the subscription metrics).
  const signupDays = sqliteClient
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date, count(*) AS views
       FROM newsletter_subscribers
       WHERE created_at >= ? AND created_at < ?
       GROUP BY substr(created_at, 1, 10)`
    )
    .all(start, endExcl) as Array<{ date: string; views: number }>;
  const signupByDay = mergeGrouped(
    buildDaySeries(start, end),
    signupDays.map((g) => ({ date: g.date, views: g.views, unique: g.views }))
  );

  const newsletterCounts = sqliteClient
    .prepare(
      `SELECT count(*) AS total,
              sum(CASE WHEN unsubscribed = 1 THEN 1 ELSE 0 END) AS unsub
       FROM newsletter_subscribers`
    )
    .get() as { total: number; unsub: number };

  // Welcome submissions (popup form) per day + unique count.
  const welcomeDays = sqliteClient
    .prepare(
      `SELECT substr(created_at, 1, 10) AS date,
              count(*) AS views,
              count(DISTINCT visitor_id) AS "unique"
       FROM welcome_submissions
       WHERE created_at >= ? AND created_at < ?
       GROUP BY substr(created_at, 1, 10)`
    )
    .all(start, endExcl) as Array<{ date: string; views: number; unique: number }>;
  const welcomeByDay = mergeGrouped(buildDaySeries(start, end), welcomeDays);
  const welcomeTotals = welcomeByDay.reduce(
    (acc, d) => ({ views: acc.views + d.views, unique: acc.unique + d.unique }),
    { views: 0, unique: 0 }
  );

  const uniqueVisitors = Number(totalsRow.uniqueVisitors || 0);
  const submissions = welcomeTotals.views;
  const conversionRate =
    uniqueVisitors > 0 ? Math.round((submissions / uniqueVisitors) * 1000) / 10 : 0;

  return {
    rangeDays,
    start,
    end,
    totals: {
      views: Number(totalsRow.views || 0),
      uniqueVisitors,
      viewsToday: Number(totalsRow.viewsToday || 0),
      uniqueToday: Number(totalsRow.uniqueToday || 0),
    },
    viewsByDay,
    devices: {
      browsers: deviceBars(browsers),
      os: deviceBars(os),
      screens: deviceBars(screens),
    },
    topPages,
    topPosts,
    newsletter: {
      signups: Number(newsletterCounts.total || 0),
      active: Number(newsletterCounts.total || 0) - Number(newsletterCounts.unsub || 0),
      unsubscribed: Number(newsletterCounts.unsub || 0),
      signupsByDay: signupByDay,
    },
    welcome: {
      submissions,
      submissionsUnique: welcomeTotals.unique,
      submissionsByDay: welcomeByDay,
      conversionRate,
    },
  };
}