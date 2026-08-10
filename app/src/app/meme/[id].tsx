import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/lib/api";
import { downloadMeme } from "@/lib/download";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import { fileUrl } from "@/lib/types";

export default function MemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const memeId = Number(id);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: meme, isLoading, error } = useQuery({
    queryKey: ["meme", memeId],
    queryFn: () => api.meme(memeId),
    enabled: !Number.isNaN(memeId),
  });

  const [fav, setFav] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!Number.isNaN(memeId)) isFavorite(memeId).then(setFav);
  }, [memeId]);

  const onToggleFav = useCallback(async () => {
    if (Number.isNaN(memeId)) return;
    const next = await toggleFavorite(memeId);
    setFav(next.includes(memeId));
  }, [memeId]);

  const onDownload = useCallback(async () => {
    if (!meme) return;
    setDownloading(true);
    try {
      const res = await downloadMeme(meme.file, meme.title || "meme");
      Alert.alert(res.ok ? "成功" : "失败", res.message);
    } finally {
      setDownloading(false);
    }
  }, [meme]);

  const onTagPress = useCallback(
    (tag: string) => router.push(`/search?tag=${encodeURIComponent(tag)}`),
    [router]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color="#4F7CFF" size="large" />
      </View>
    );
  }

  if (error || !meme) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>表情包不存在或加载失败</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 返回</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          <Image
            source={fileUrl(meme.file)}
            style={styles.image}
            contentFit="contain"
            transition={200}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.title}>{meme.title}</Text>
          {meme.categoryName ? (
            <Text style={styles.category}>{meme.categoryName}</Text>
          ) : null}
          {meme.emotion || meme.action ? (
            <Text style={styles.meta}>
              {[meme.emotion, meme.action, meme.scene].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          {meme.tags.length > 0 ? (
            <View style={styles.tags}>
              {meme.tags.map((t) => (
                <Pressable
                  key={t}
                  style={styles.tag}
                  onPress={() => onTagPress(t)}>
                  <Text style={styles.tagText}>#{t}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.actionBtn, fav && styles.actionBtnActive]}
          onPress={onToggleFav}>
          <Text style={[styles.actionText, fav && styles.actionTextActive]}>
            {fav ? "♥ 已收藏" : "♡ 收藏"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.downloadBtn]}
          onPress={onDownload}
          disabled={downloading}>
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionText}>下载 / 保存</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    fontSize: 16,
    color: "#4F7CFF",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#999",
    fontSize: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  imageWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f7f8fa",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  image: {
    width: "100%",
    minHeight: 300,
  },
  info: {
    marginTop: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    lineHeight: 26,
  },
  category: {
    marginTop: 6,
    fontSize: 13,
    color: "#4F7CFF",
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: "#888",
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: "#f2f3f5",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    color: "#555",
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f2f3f5",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnActive: {
    backgroundColor: "#ffe9ec",
  },
  downloadBtn: {
    backgroundColor: "#4F7CFF",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  actionTextActive: {
    color: "#e5484d",
  },
});
