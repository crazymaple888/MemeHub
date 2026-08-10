import { memo, useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";

import MemeCard from "./MemeCard";
import type { Meme } from "@/lib/types";

interface Props {
  memes: Meme[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  emptyText?: string;
}

function MemeGrid({
  memes,
  loading,
  hasMore,
  onLoadMore,
  onRefresh,
  refreshing,
  emptyText = "暂无表情包",
}: Props) {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const columnCount = width >= 1200 ? 6 : width >= 768 ? 4 : 2;
  const gutter = 8;
  const colW = (width - 48 - gutter * (columnCount - 1)) / columnCount;

  const openMeme = useCallback(
    (meme: Meme) => router.push(`/meme/${meme.id}`),
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Meme }) => (
      <View style={{ width: colW }}>
        <MemeCard meme={item} onPress={openMeme} width={colW} />
      </View>
    ),
    [colW, openMeme]
  );

  const keyExtractor = useCallback((item: Meme) => String(item.id), []);

  // endless scroll: load more when near the end
  const onEndReached = useCallback(() => {
    if (hasMore && !loading) onLoadMoreRef.current();
  }, [hasMore, loading]);

  return (
    <FlatList
      data={memes}
      key={columnCount}
      numColumns={columnCount}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      refreshing={refreshing}
      ListEmptyComponent={
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4F7CFF" size="large" />
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.empty}>{emptyText}</Text>
          </View>
        )
      }
      ListFooterComponent={
        loading && memes.length > 0 ? (
          <View style={styles.footer}>
            <ActivityIndicator color="#4F7CFF" />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    paddingVertical: 60,
    alignItems: "center",
  },
  empty: {
    color: "#999",
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default memo(MemeGrid);
