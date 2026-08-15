import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import MemeGrid from "@/components/MemeGrid";
import { Colors } from "@/constants/theme";
import { api } from "@/lib/api";
import { getFavorites } from "@/lib/favorites";
import type { Meme } from "@/lib/types";

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const ids = await getFavorites();
    setFavorites(ids);
    if (ids.length === 0) {
      setMemes([]);
      setLoading(false);
      return;
    }
    try {
      const items = await Promise.all(
        ids.map((id) => api.meme(id).catch(() => null))
      );
      setMemes(items.filter((x): x is Meme => x !== null));
    } catch {
      setMemes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 每次进入页面重新加载，保证收藏变化即时反映
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>我的收藏 ({favorites.length})</Text>
      <MemeGrid
        memes={memes}
        loading={loading}
        hasMore={false}
        onLoadMore={() => {}}
        onRefresh={load}
        refreshing={loading}
        emptyText="还没有收藏任何表情包，去浏览页点点爱心吧"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
