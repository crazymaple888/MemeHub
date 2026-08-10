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
  // 记录上次已加载的过滤条件，条件变化时清空并重新加载
  const loadedKeyRef = useRef<string | null>(null);

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

  // 过滤条件变化 或 首次挂载时：重置并加载第一页
  useEffect(() => {
    if (loadedKeyRef.current === key) return;
    loadedKeyRef.current = key;
    setMemes([]);
    setTotalPages(1);
    fetchPage(1, false);
    // fetchPage 依赖 category/query/tag，条件变化时自动重新执行
  }, [key, fetchPage]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading) fetchPage(page + 1, true);
  }, [page, totalPages, loading, fetchPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPage(1, false);
  }, [fetchPage]);

  return { memes, loading, refreshing, error, hasMore: page < totalPages, loadMore, refresh };
}
