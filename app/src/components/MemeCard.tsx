import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import { fileUrl, type Meme } from "@/lib/types";

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
  const thumb = fileUrl(meme.thumb) ?? fileUrl(meme.file);
  const gif = fileUrl(meme.file);

  return (
    <Pressable
      onPress={() => onPress(meme)}
      style={({ pressed }) => [
        styles.card,
        { width: cardW },
        pressed && styles.pressed,
      ]}>
      <View style={styles.imageWrap}>
        <Image
          source={gif}
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
    marginBottom: 12,
  },
  pressed: {
    opacity: 0.8,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#f2f3f5",
  },
  image: {
    borderRadius: 12,
  },
  title: {
    marginTop: 6,
    fontSize: 12,
    color: "#333",
    lineHeight: 16,
  },
  cat: {
    marginTop: 2,
    fontSize: 11,
    color: "#999",
  },
});

export default memo(MemeCard);
