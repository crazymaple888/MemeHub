import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MemeGrid from "@/components/MemeGrid";
import { usePaginatedMemes } from "@/hooks/use-paginated-memes";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string>("all");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: api.categories,
  });

  const { memes, loading, hasMore, loadMore, refresh, refreshing } =
    usePaginatedMemes({ category });

  const all = useMemo<Category>(
    () => ({ id: 0, name: "全部", slug: "all", count: 0, cover: null }),
    []
  );

  const onSelect = useCallback((slug: string) => {
    setCategory(slug);
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.catWrap, { paddingTop: insets.top + 8 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catContent}>
          {[all, ...(categories ?? [])].map((c) => {
            const active = c.slug === category;
            return (
              <Pressable
                key={c.slug}
                onPress={() => onSelect(c.slug)}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {c.name}
                  {c.count > 0 ? ` (${c.count})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <MemeGrid
        memes={memes}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRefresh={refresh}
        refreshing={refreshing}
        emptyText={category === "all" ? "暂无表情包，请先运行 seed 脚本" : "该分类暂无表情包"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  catWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  catContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: "#f2f3f5",
  },
  chipActive: {
    backgroundColor: "#4F7CFF",
  },
  chipText: {
    fontSize: 13,
    color: "#333",
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});
