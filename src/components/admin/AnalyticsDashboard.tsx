"use client";

import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import type { AnalyticsData, DayPoint } from "@/lib/analytics";
import { LoadingScreen } from "@/components/shared/LoadingSpinner";

type ChartType = "bar" | "line";
type RangeMode = "preset" | "custom";

interface SeriesColors {
  barClass: string;
  lineColor: string;
  areaColor: string;
}

const PRESETS = [
  { days: 7, label: "7 ngày" },
  { days: 14, label: "14 ngày" },
  { days: 30, label: "30 ngày" },
  { days: 60, label: "60 ngày" },
];

const VIEWS_COLORS: SeriesColors = {
  barClass: "bg-blue-500 dark:bg-blue-400",
  lineColor: "#3b82f6",
  areaColor: "rgba(59,130,246,0.2)",
};
const WELCOME_COLORS: SeriesColors = {
  barClass: "bg-green-500 dark:bg-green-400",
  lineColor: "#22c55e",
  areaColor: "rgba(34,197,94,0.2)",
};
const NEWSLETTER_COLORS: SeriesColors = {
  barClass: "bg-purple-500 dark:bg-purple-400",
  lineColor: "#a855f7",
  areaColor: "rgba(168,85,247,0.2)",
};

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function localToday(): string {
  return toLocalISO(new Date());
}

function localDateAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toLocalISO(d);
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const showYear = y !== String(new Date().getFullYear());
  return `${d}/${m}${showYear ? `/${y}` : ""}`;
}

export default function AnalyticsDashboard() {
  const [chartType, setChartType] = useState<ChartType>("line");
  const [range, setRange] = useState(30);
  const [mode, setMode] = useState<RangeMode>("preset");
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [draftStart, setDraftStart] = useState(() => localDateAgo(29));
  const [draftEnd, setDraftEnd] = useState(() => localToday());
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params =
      mode === "custom" && customStart && customEnd
        ? `start=${encodeURIComponent(customStart)}&end=${encodeURIComponent(customEnd)}`
        : `range=${range}`;
    fetch(`/api/admin/analytics?${params}`)
      .then((res) =>
        res.ok
          ? (res.json() as Promise<AnalyticsData>)
          : Promise.reject(new Error("Không thể tải dữ liệu"))
      )
      .then((d) => setData(d))
      .catch((e) =>
        toast.error(e instanceof Error ? e.message : "Lỗi tải dữ liệu")
      )
      .finally(() => setLoading(false));
  }, [range, mode, customStart, customEnd]);

  const pickPreset = (days: number) => {
    setMode("preset");
    setRange(days);
  };

  const applyCustom = () => {
    if (!draftStart || !draftEnd) {
      toast.error("Chọn ngày bắt đầu và ngày kết thúc");
      return;
    }
    if (draftStart > draftEnd) {
      toast.error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
      return;
    }
    setCustomStart(draftStart);
    setCustomEnd(draftEnd);
    setMode("custom");
  };

  const dateInputClass =
    "px-2.5 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:[color-scheme:dark]";
  const dateInputBase = `${dateInputClass} w-[150px]`;

  return (
    <div className="space-y-6">
      {/* Toolbar: range presets + custom dates + chart type */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((o) => (
            <button
              key={o.days}
              onClick={() => pickPreset(o.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                mode === "preset" && range === o.days
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {o.label}
            </button>
          ))}

          <span className="hidden sm:inline text-gray-300 dark:text-gray-600 select-none">|</span>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={draftStart}
              max={draftEnd || localToday()}
              onChange={(e) => setDraftStart(e.target.value)}
              className={dateInputBase}
              aria-label="Ngày bắt đầu"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              value={draftEnd}
              max={localToday()}
              onChange={(e) => setDraftEnd(e.target.value)}
              className={dateInputBase}
              aria-label="Ngày kết thúc"
            />
            <button
              onClick={applyCustom}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                mode === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              Áp dụng
            </button>
          </div>

          {data && (
            <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {fmtDate(data.start)} – {fmtDate(data.end)}{" "}
              <span className="opacity-70">({data.rangeDays} ngày)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
            Loại biểu đồ:
          </span>
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType("bar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "bar"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="12" width="4" height="8" rx="1" />
                <rect x="10" y="7" width="4" height="13" rx="1" />
                <rect x="16" y="3" width="4" height="17" rx="1" />
              </svg>
              Cột
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 17 9 11 13 15 21 5" />
              </svg>
              Đường
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingScreen label="Đang tải dữ liệu thống kê..." />
      ) : data ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Lượt xem" value={data.totals.views} />
            <StatCard label="Khách truy cập" value={data.totals.uniqueVisitors} />
            <StatCard label="Lượt xem hôm nay" value={data.totals.viewsToday} />
            <StatCard
              label="Đăng ký popup"
              value={data.welcome.submissions}
              subtitle={`${data.welcome.conversionRate}% chuyển đổi`}
            />
          </div>

          {/* Views per day */}
          <Section title="Lượt xem theo ngày">
            <TimeSeriesChart
              points={data.viewsByDay}
              type={chartType}
              height={160}
              colors={VIEWS_COLORS}
            />
          </Section>

          {/* Devices */}
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Trình duyệt">
              <HorizontalBarChart items={data.devices.browsers} maxCount={maxDevice(data)} />
            </Section>
            <Section title="Hệ điều hành">
              <HorizontalBarChart items={data.devices.os} maxCount={maxDevice(data)} />
            </Section>
          </div>

          {/* Top posts */}
          <Section title="Bài viết được đọc nhiều nhất">
            {data.topPosts.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Chưa có dữ liệu</p>
            ) : (
              <ol className="space-y-2">
                {data.topPosts.slice(0, 15).map((p, i) => (
                  <li key={p.path} className="flex items-center justify-between text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate block">
                        {i + 1}. {p.title || p.slug}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{p.slug}</span>
                    </div>
                    <span className="ml-4 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {p.views} lượt
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          {/* Welcome + Newsletter per day */}
          <div className="grid md:grid-cols-2 gap-6">
            <Section title="Đăng ký popup theo ngày">
              <TimeSeriesChart
                points={data.welcome.submissionsByDay}
                type={chartType}
                height={128}
                colors={WELCOME_COLORS}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Tỷ lệ chuyển đổi: {data.welcome.conversionRate}% ({data.welcome.submissions} submissions /{" "}
                {data.welcome.submissionsUnique} unique)
              </p>
            </Section>
            <Section title="Đăng ký newsletter theo ngày">
              <TimeSeriesChart
                points={data.newsletter.signupsByDay}
                type={chartType}
                height={128}
                colors={NEWSLETTER_COLORS}
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                Tổng: {data.newsletter.active} đang nhận / {data.newsletter.unsubscribed} đã hủy
              </p>
            </Section>
          </div>
        </>
      ) : null}
    </div>
  );
}

function maxDevice(data: AnalyticsData): number {
  return Math.max(
    1,
    ...data.devices.browsers.map((d) => d.count),
    ...data.devices.os.map((d) => d.count)
  );
}

function StatCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value.toLocaleString("vi-VN")}
      </p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function TimeSeriesChart({
  points,
  type,
  height,
  colors,
}: {
  points: DayPoint[];
  type: ChartType;
  height: number;
  colors: SeriesColors;
}) {
  if (type === "line") {
    return (
      <LineChart
        points={points}
        lineColor={colors.lineColor}
        areaColor={colors.areaColor}
        height={height}
      />
    );
  }
  return <VerticalBarChart points={points} barClass={colors.barClass} height={height} />;
}

function VerticalBarChart({
  points,
  barClass,
  height,
}: {
  points: DayPoint[];
  barClass: string;
  height: number;
}) {
  const max = Math.max(1, ...points.map((p) => p.views));
  const showValues = points.length <= 31;
  return (
    <div className="flex items-end gap-1 overflow-x-auto" style={{ height }}>
      {points.map((d) => (
        <div key={d.date} className="flex flex-col items-center min-w-[18px] h-full justify-end shrink-0">
          {showValues && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mb-0.5">{d.views}</span>
          )}
          <div
            className={`w-full ${barClass} rounded-t min-h-[2px]`}
            style={{ height: `${(d.views / max) * 100}%` }}
          />
          <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-none">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({
  points,
  lineColor,
  areaColor,
  height,
}: {
  points: DayPoint[];
  lineColor: string;
  areaColor: string;
  height: number;
}) {
  const gradId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const W = 600;
  const H = 160;
  const n = points.length;
  const max = Math.max(1, ...points.map((p) => p.views));
  const x = (i: number) => (n > 1 ? (i / (n - 1)) * (W - 8) + 4 : W / 2);
  const y = (v: number) => H - 4 - (v / max) * (H - 8);
  const line = points.map((_, i) => `${x(i).toFixed(1)},${y(points[i].views).toFixed(1)}`).join(" ");
  const area = `4,${H - 4} ${line} ${W - 4},${H - 4}`;
  const gridVals = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = Math.max(1, Math.ceil(n / 8));

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Biểu đồ đường"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaColor} />
            <stop offset="100%" stopColor={areaColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridVals.map((g) => (
          <line
            key={g}
            x1="4"
            x2={W - 4}
            y1={y(g * max)}
            y2={y(g * max)}
            stroke="currentColor"
            strokeWidth="1"
            className="text-gray-100 dark:text-gray-800"
          />
        ))}
        <polygon points={area} fill={`url(#${gradId})`} />
        <polyline
          points={line}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <rect key={p.date} x={x(i) - 8} y={0} width={16} height={H} fill="transparent">
            <title>{`${p.date}: ${p.views} lượt`}</title>
          </rect>
        ))}
      </svg>
      <div className="flex mt-1">
        {points.map((p, i) => (
          <span
            key={p.date}
            style={{ width: `${100 / n}%` }}
            className={`text-[10px] text-gray-400 dark:text-gray-500 text-left truncate ${
              i % labelStep !== 0 && i !== n - 1 ? "invisible" : ""
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function HorizontalBarChart({
  items,
  maxCount,
}: {
  items: Array<{ label: string; count: number }>;
  maxCount: number;
}) {
  if (!items.length)
    return <p className="text-sm text-gray-400 dark:text-gray-500">Không có dữ liệu</p>;
  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm">
          <span className="w-28 text-right text-gray-500 dark:text-gray-400 text-xs truncate">
            {item.label}
          </span>
          <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 rounded"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs text-gray-400 dark:text-gray-500">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}

