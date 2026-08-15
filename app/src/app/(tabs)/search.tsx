import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";

import MemeGrid from "@/components/MemeGrid";
import { Colors, Radii } from "@/constants/theme";
import { usePaginatedMemes } from "@/hooks/use-paginated-memes";

export default function SearchScreen() {
  const params = useLocalSearchParams<{ tag?: string }>();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(params.tag ?? "");
  const initialized = useRef(false);

  // 从详情页点标签跳转过来时，同步 tag 到状态
  useFocusEffect(
    useCallback(() => {
      if (params.tag && params.tag !== tag) {
        setTag(params.tag);
        setInput("");
        setQuery("");
      }
      initialized.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.tag])
  );

  const { memes, loading, hasMore, loadMore, refresh, refreshing } =
    usePaginatedMemes({ query, tag });

  const submit = useCallback(() => {
    setQuery(input.trim());
  }, [input]);

  const clear = useCallback(() => {
    setInput("");
    setQuery("");
    setTag("");
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="搜索表情包名称 / 描述 / 情绪..."
            placeholderTextColor={Colors.light.textMuted}
            value={input}
            onChangeText={setInput}
            returnKeyType="search"
            onSubmitEditing={submit}
          />
        </View>
        <Pressable onPress={submit} style={styles.btnWrap}>
          <LinearGradient
            colors={Colors.light.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}>
            <Text style={styles.btnText}>搜索</Text>
          </LinearGradient>
        </Pressable>
        {(query || tag) ? (
          <Pressable style={styles.clearBtn} onPress={clear}>
            <Text style={styles.clearText}>清除</Text>
          </Pressable>
        ) : null}
      </View>

      {query ? (
        <Text style={styles.hint}>
          关键词：「{query}」{tag ? ` · 标签：#${tag}` : ""}
        </Text>
      ) : null}

      <MemeGrid
        memes={memes}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRefresh={refresh}
        refreshing={refreshing}
        emptyText={
          query || tag
            ? "没有找到匹配的表情包"
            : "输入关键词搜索，支持标题/描述/情绪/标签"
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    height: 42,
    borderRadius: Radii.pill,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.text,
  },
  btnWrap: {
    borderRadius: Radii.pill,
  },
  btn: {
    paddingHorizontal: 18,
    height: 42,
    borderRadius: Radii.pill,
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  clearBtn: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  clearText: {
    color: Colors.light.textMuted,
    fontSize: 13,
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});
