import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
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
import { Colors, Radii, Shadows } from "@/constants/theme";
import { downloadMeme } from "@/lib/download";
import { toggleFavorite, isFavorite } from "@/lib/favorites";
import { imgSource } from "@/lib/types";

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
      const res = await downloadMeme(meme, meme.title || "meme");
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
        <ActivityIndicator color={Colors.light.primary} size="large" />
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
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.imageWrap, Shadows.card]}>
          <Image
            source={imgSource(meme)}
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
          style={styles.downloadWrap}
          onPress={onDownload}
          disabled={downloading}>
          <LinearGradient
            colors={Colors.light.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.downloadBtn}>
            {downloading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.downloadText}>下载 / 保存</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnPressed: {
    backgroundColor: Colors.light.surfaceHover,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: Colors.light.textMuted,
    fontSize: 15,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  imageWrap: {
    borderRadius: Radii.lg,
    overflow: "hidden",
    backgroundColor: "#0F1118",
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
    color: Colors.light.text,
    lineHeight: 26,
  },
  category: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.light.secondary,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.textMuted,
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    backgroundColor: Colors.light.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.line,
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.line,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnActive: {
    backgroundColor: "#241A2E",
    borderColor: Colors.light.favorite,
  },
  downloadWrap: {
    flex: 1,
    borderRadius: Radii.pill,
  },
  downloadBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radii.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  actionTextActive: {
    color: Colors.light.favorite,
  },
  downloadText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
