export interface CategoryColor {
  key: string;
  label: string;
  gradient: string;
  bg: string;
  darkBg: string;
  text: string;
  darkText: string;
  swatch: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  yellow: {
    key: "yellow", label: "Vàng",
    gradient: "from-yellow-400 to-orange-400",
    bg: "bg-yellow-50", darkBg: "dark:bg-yellow-500/5",
    text: "text-yellow-700", darkText: "dark:text-yellow-400",
    swatch: "bg-yellow-400",
  },
  blue: {
    key: "blue", label: "Xanh dương",
    gradient: "from-blue-400 to-blue-600",
    bg: "bg-blue-50", darkBg: "dark:bg-blue-500/5",
    text: "text-blue-700", darkText: "dark:text-blue-400",
    swatch: "bg-blue-500",
  },
  cyan: {
    key: "cyan", label: "Cyan",
    gradient: "from-cyan-400 to-cyan-600",
    bg: "bg-cyan-50", darkBg: "dark:bg-cyan-500/5",
    text: "text-cyan-700", darkText: "dark:text-cyan-400",
    swatch: "bg-cyan-500",
  },
  gray: {
    key: "gray", label: "Xám",
    gradient: "from-gray-400 to-gray-600",
    bg: "bg-gray-100", darkBg: "dark:bg-gray-200/5",
    text: "text-gray-700", darkText: "dark:text-gray-300",
    swatch: "bg-gray-500",
  },
  green: {
    key: "green", label: "Xanh lá",
    gradient: "from-green-400 to-green-600",
    bg: "bg-green-50", darkBg: "dark:bg-green-500/5",
    text: "text-green-700", darkText: "dark:text-green-400",
    swatch: "bg-green-500",
  },
  sky: {
    key: "sky", label: "Xanh nhạt",
    gradient: "from-sky-400 to-sky-600",
    bg: "bg-sky-50", darkBg: "dark:bg-sky-500/5",
    text: "text-sky-700", darkText: "dark:text-sky-400",
    swatch: "bg-sky-500",
  },
  purple: {
    key: "purple", label: "Tím",
    gradient: "from-purple-400 to-purple-600",
    bg: "bg-purple-50", darkBg: "dark:bg-purple-500/5",
    text: "text-purple-700", darkText: "dark:text-purple-400",
    swatch: "bg-purple-500",
  },
  emerald: {
    key: "emerald", label: "Ngọc lục bảo",
    gradient: "from-emerald-400 to-emerald-600",
    bg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/5",
    text: "text-emerald-700", darkText: "dark:text-emerald-400",
    swatch: "bg-emerald-500",
  },
  red: {
    key: "red", label: "Đỏ",
    gradient: "from-red-400 to-red-600",
    bg: "bg-red-50", darkBg: "dark:bg-red-500/5",
    text: "text-red-700", darkText: "dark:text-red-400",
    swatch: "bg-red-500",
  },
  orange: {
    key: "orange", label: "Cam",
    gradient: "from-orange-400 to-orange-600",
    bg: "bg-orange-50", darkBg: "dark:bg-orange-500/5",
    text: "text-orange-700", darkText: "dark:text-orange-400",
    swatch: "bg-orange-500",
  },
  pink: {
    key: "pink", label: "Hồng",
    gradient: "from-pink-400 to-pink-600",
    bg: "bg-pink-50", darkBg: "dark:bg-pink-500/5",
    text: "text-pink-700", darkText: "dark:text-pink-400",
    swatch: "bg-pink-500",
  },
  indigo: {
    key: "indigo", label: "Chàm",
    gradient: "from-indigo-400 to-indigo-600",
    bg: "bg-indigo-50", darkBg: "dark:bg-indigo-500/5",
    text: "text-indigo-700", darkText: "dark:text-indigo-400",
    swatch: "bg-indigo-500",
  },
  teal: {
    key: "teal", label: "Teal",
    gradient: "from-teal-400 to-teal-600",
    bg: "bg-teal-50", darkBg: "dark:bg-teal-500/5",
    text: "text-teal-700", darkText: "dark:text-teal-400",
    swatch: "bg-teal-500",
  },
  lime: {
    key: "lime", label: "Vôi",
    gradient: "from-lime-400 to-lime-600",
    bg: "bg-lime-50", darkBg: "dark:bg-lime-500/5",
    text: "text-lime-700", darkText: "dark:text-lime-400",
    swatch: "bg-lime-500",
  },
  amber: {
    key: "amber", label: "Hổ phách",
    gradient: "from-amber-400 to-amber-600",
    bg: "bg-amber-50", darkBg: "dark:bg-amber-500/5",
    text: "text-amber-700", darkText: "dark:text-amber-400",
    swatch: "bg-amber-500",
  },
  rose: {
    key: "rose", label: "Hồng rose",
    gradient: "from-rose-400 to-rose-600",
    bg: "bg-rose-50", darkBg: "dark:bg-rose-500/5",
    text: "text-rose-700", darkText: "dark:text-rose-400",
    swatch: "bg-rose-500",
  },
};

export const CATEGORY_COLOR_OPTIONS = Object.values(CATEGORY_COLORS);

export const DEFAULT_CATEGORY_COLOR = "gray";

export function categoryColor(key?: string | null): CategoryColor {
  return CATEGORY_COLORS[key || DEFAULT_CATEGORY_COLOR] ||
    CATEGORY_COLORS[DEFAULT_CATEGORY_COLOR];
}