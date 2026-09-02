"use client";

export type SortDir = "asc" | "desc";

export function SortableTh({
  label,
  align = "left",
  sortKey,
  currentKey,
  dir,
  onSort,
}: {
  label: string;
  align?: "left" | "right";
  sortKey: string;
  currentKey: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
}) {
  const active = currentKey === sortKey;
  const isRight = align === "right";
  return (
    <th
      className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap ${
        isRight ? "text-right" : "text-left"
      } text-gray-400 dark:text-gray-500`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 align-middle focus:outline-none focus-visible:ring-0 select-none ${
          isRight ? "flex-row-reverse" : ""
        } ${
          active
            ? "text-blue-600 dark:text-blue-400"
            : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
        }`}
      >
        {label}
        <span
          className={`text-[9px] leading-none transition-opacity ${
            active ? "opacity-100" : "opacity-40"
          }`}
          aria-hidden
        >
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}
