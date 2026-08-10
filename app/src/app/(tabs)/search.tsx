import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from "react-native";

import MemeGrid from "@/components/MemeGrid";
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
        <TextInput
          style={styles.input}
          placeholder="搜索表情包名称 / 描述 / 情绪..."
          placeholderTextColor="#999"
          value={input}
          onChangeText={setInput}
          returnKeyType="search"
          onSubmitEditing={submit}
        />
        <Pressable style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>搜索</Text>
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
    backgroundColor: "#fff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f2f3f5",
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#333",
  },
  btn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4F7CFF",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  clearBtn: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  clearText: {
    color: "#999",
    fontSize: 13,
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: "#666",
  },
});
