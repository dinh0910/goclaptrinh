"use client";

import { useCallback, useState } from "react";
import type { SortDir } from "./SortableTh";

type SearchFn<T> = (item: T) => string;

interface Options<T> {
  pageSize?: number;
  searchKeys?: SearchFn<T>[];
  sortable?: boolean;
}

export function useTableControls<T>({
  pageSize: initialPageSize = 10,
  searchKeys = [],
  sortable = true,
}: Options<T> = {}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const changePageSize = useCallback((n: number) => {
    setPageSize(n);
    setPage(1);
  }, []);

  const setSearchAndReset = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);

  const setColumnSort = useCallback(
    (key: string) => {
      if (!sortable) return;
      if (sortKey === key) {
        // same column: cycle asc -> desc -> original order
        if (sortDir === "asc") {
          setSortDir("desc");
        } else {
          setSortKey(null);
          setSortDir("asc");
        }
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(1);
    },
    [sortKey, sortDir, sortable]
  );

  // `getSortValue` maps a sort key to the actual accessor.
  const process = useCallback(
    (items: T[], getSortValue: (key: string, item: T) => string | number) => {
      let result = items;

      if (searchKeys.length && search.trim()) {
        const q = search.trim().toLowerCase();
        result = result.filter((item) =>
          searchKeys.some((fn) => fn(item).toLowerCase().includes(q))
        );
      }

      if (sortable && sortKey) {
        const sorter = (a: T, b: T) => {
          const av = getSortValue(sortKey, a);
          const bv = getSortValue(sortKey, b);
          let cmp = 0;
          if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
          else cmp = String(av).localeCompare(String(bv), "vi");
          return sortDir === "asc" ? cmp : -cmp;
        };
        result = [...result].sort(sorter);
      }

      const total = result.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(Math.max(1, page), totalPages);
      const start = (safePage - 1) * pageSize;
      const pageItems = result.slice(start, start + pageSize);

      return { total, totalPages, page: safePage, pageItems };
    },
    [search, searchKeys, sortable, sortKey, sortDir, page, pageSize]
  );

  return {
    search,
    setSearchAndReset,
    sortKey,
    sortDir,
    setColumnSort,
    page,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    process,
  };
}
