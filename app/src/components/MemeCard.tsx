import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { Colors, Radii, Shadows } from "@/constants/theme";
import { imgSource, type Meme } from "@/lib/types";

interface Props {
  meme: Meme;
  onPress: (meme: Meme) => void;
  width?: number;
  columnCount?: number;
}

function MemeCard({ meme, onPress, width, columnCount = 3 }: Props) {
  const { width: winW } = useWindowDimensions();
  const colW = columnCount >= 4 ? 220 : columnCount >= 3 ? 180 : 150;
  const cardW = width ?? Math.min(colW, Math.max(120, (winW - 48) / columnCount));
  const src = imgSource(meme);

  return (
    <Pressable
      onPress={() => onPress(meme)}
      style={({ pressed }) => [
        styles.card,
        { width: cardW },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={styles.imageWrap}>
        <Image
          source={src}
          style={[styles.image, { width: cardW, height: cardW }]}
          contentFit="contain"
          cachePolicy="memory-disk"
          transition={120}
        />
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {meme.title || meme.description}
      </Text>
      {meme.categoryName ? (
        <Text numberOfLines={1} style={styles.cat}>
          {meme.categoryName}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    padding: 8,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: Colors.light.surfaceHover,
  },
  imageWrap: {
    borderRadius: Radii.md,
    overflow: "hidden",
    backgroundColor: "#0F1118",
  },
  image: {
    borderRadius: Radii.md,
  },
  title: {
    marginTop: 8,
    fontSize: 12,
    color: Colors.light.text,
    lineHeight: 16,
  },
  cat: {
    marginTop: 3,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
});

export default memo(MemeCard);
