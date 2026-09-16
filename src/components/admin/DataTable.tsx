"use client";

import type { ReactNode } from "react";
import { SearchBar } from "./SearchBar";
import { Pagination } from "./Pagination";
import { SortableTh } from "./SortableTh";
import { useTableControls } from "./useTableControls";

interface Column {
  label: string;
  sortKey?: string;
  align?: "left" | "right";
}

interface DataTableProps<T> {
  columns: Column[];
  rows: T[];
  rowKey: (item: T) => string | number;
  renderRow: (item: T, index: number) => ReactNode;
  getSortValue?: (key: string, item: T) => string | number;
  searchKeys?: ((item: T) => string)[];
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  emptyIcon?: ReactNode;
  emptyText?: string;
  emptyHint?: string;
  maxHeight?: string;
  sortable?: boolean;
  pageSize?: number;
}

const thBase =
  "px-4 py-3.5 text-sm font-bold uppercase tracking-wider whitespace-nowrap";

export default function DataTable<T>({
  columns,
  rows,
  renderRow,
  getSortValue = () => "",
  searchKeys = [],
  searchPlaceholder = "Tìm kiếm...",
  toolbar,
  emptyIcon,
  emptyText = "Chưa có dữ liệu.",
  emptyHint,
  maxHeight = "max-h-[calc(100dvh-22.5rem)]",
  sortable = true,
  pageSize = 10,
}: DataTableProps<T>) {
  const ctrl = useTableControls<T>({ searchKeys, sortable, pageSize });
  const { total, totalPages, page, pageItems } = ctrl.process(rows, getSortValue);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-800 flex-wrap">
        <SearchBar
          value={ctrl.search}
          onChange={ctrl.setSearchAndReset}
          placeholder={searchPlaceholder}
        />
        {toolbar}
      </div>
      {rows.length === 0 ? (
        <div className="p-10 text-center">
          <div className="flex flex-col items-center gap-2">
            {emptyIcon}
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {emptyText}
            </p>
            {emptyHint && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {emptyHint}
              </p>
            )}
          </div>
        </div>
      ) : pageItems.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Không tìm thấy kết quả phù hợp.
          </p>
        </div>
      ) : (
        <>
          <div className={`${maxHeight} overflow-y-auto`}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {columns.map((col, i) => {
                    const isRight = col.align === "right";
                    if (col.sortKey) {
                      return (
                        <SortableTh
                          key={i}
                          label={col.label}
                          align={isRight ? "right" : "left"}
                          sortKey={col.sortKey}
                          currentKey={ctrl.sortKey}
                          dir={ctrl.sortDir}
                          onSort={ctrl.setColumnSort}
                        />
                      );
                    }
                    return (
                      <th
                        key={i}
                        aria-label={col.label || "Thao tác"}
                        className={`${thBase} ${
                          isRight ? "text-right" : "text-left"
                        } text-gray-400 dark:text-gray-500`}
                      >
                        {col.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {pageItems.map((item, i) => renderRow(item, i))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={ctrl.pageSize}
            onPageChange={ctrl.setPage}
            onPageSizeChange={ctrl.setPageSize}
          />
        </>
      )}
    </div>
  );
}