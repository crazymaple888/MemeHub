import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MemeGrid from "@/components/MemeGrid";
import { Colors, Radii } from "@/constants/theme";
import { usePaginatedMemes } from "@/hooks/use-paginated-memes";
import { api } from "@/lib/api";
import type { Category } from "@/lib/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<string>("all");
  const colors = Colors.light;

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
                style={styles.chipWrap}>
                {active ? (
                  <LinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.chipActive}>
                    <Text style={styles.chipTextActive}>
                      {c.name}
                      {c.count > 0 ? ` ${c.count}` : ""}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>
                      {c.name}
                      {c.count > 0 ? ` ${c.count}` : ""}
                    </Text>
                  </View>
                )}
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
    backgroundColor: Colors.light.background,
  },
  catWrap: {
    backgroundColor: Colors.light.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.line,
    paddingBottom: 10,
  },
  catContent: {
    paddingHorizontal: 14,
    gap: 8,
  },
  chipWrap: {
    borderRadius: Radii.pill,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  chipActive: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  chipText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  chipTextActive: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "700",
  },
});
