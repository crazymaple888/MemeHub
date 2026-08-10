import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import type { Meme } from "@/lib/types";

interface Options {
  category?: string;
  query?: string;
  tag?: string;
  pageSize?: number;
}

export function usePaginatedMemes({ category, query, tag, pageSize = 24 }: Options) {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = `${category ?? "all"}|${query ?? ""}|${tag ?? ""}`;
  const keyRef = useRef(key);
  const loadRef = useRef<() => void>(() => {});

  const fetchPage = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.memes({
          category,
          query,
          tag,
          page: pageNum,
          pageSize,
        });
        setMemes((prev) => (append ? [...prev, ...res.items] : res.items));
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch (e: any) {
        setError(e.message || "加载失败");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, query, tag, pageSize]
  );

  // reset when filters change
  useEffect(() => {
    if (keyRef.current === key) return;
    keyRef.current = key;
    setMemes([]);
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // initial load
  useEffect(() => {
    fetchPage(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) fetchPage(page + 1, true);
  }, [page, totalPages, loading, fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, false);
  }, [fetchPage]);

  loadRef.current = loadMore;

  return { memes, loading, refreshing, error, hasMore: page < totalPages, loadMore, refresh };
}
