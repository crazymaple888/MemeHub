import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, ApiError, type AdminUser } from "@/lib/api";
import { getAdminKey, setAdminKey } from "@/lib/auth";
import { Colors, Radii } from "@/constants/theme";

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [key, setKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [requests, all] = await Promise.all([
        api.adminRequests(),
        api.adminUsers(),
      ]);
      // 合并：pending 排前，其余按最近
      const pendingIds = new Set(requests.map((u) => u.id));
      const merged = [
        ...requests,
        ...all.filter((u) => !pendingIds.has(u.id)),
      ];
      setUsers(merged);
    } catch (e: any) {
      Alert.alert("加载失败", e.message || "请检查管理员密钥");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadKey = useCallback(async () => {
    const saved = await getAdminKey();
    if (saved) {
      setKey(saved);
      setKeyInput(saved);
      setHasKey(true);
      loadUsers();
    }
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      loadKey();
    }, [loadKey])
  );

  const saveKey = useCallback(async () => {
    const k = keyInput.trim();
    if (!k) {
      Alert.alert("提示", "请输入管理员密钥");
      return;
    }
    await setAdminKey(k);
    setKey(k);
    setHasKey(true);
    loadUsers();
  }, [keyInput, loadUsers]);

  const act = useCallback(
    async (id: number, approve: boolean) => {
      try {
        if (approve) await api.adminApprove(id);
        else await api.adminReject(id);
        loadUsers();
      } catch (e: any) {
        Alert.alert("操作失败", e.message || "请稍后再试");
      }
    },
    [loadUsers]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}>
          <Ionicons name="chevron-back" size={22} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.pageTitle}>上传权限审核</Text>
      </View>

      {/* 密钥输入 */}
      <View style={styles.keyWrap}>
        <TextInput
          style={styles.keyInput}
          placeholder="输入管理员密钥"
          placeholderTextColor={Colors.light.textMuted}
          value={keyInput}
          onChangeText={setKeyInput}
          secureTextEntry={!hasKey}
        />
        <Pressable onPress={saveKey} style={styles.keyBtnWrap}>
          <LinearGradient
            colors={Colors.light.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.keyBtn}>
            <Text style={styles.keyBtnText}>验证</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {hasKey ? (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.light.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(u) => String(u.id)}
            contentContainerStyle={styles.list}
            ListHeaderComponent={
              <Text style={styles.listHeader}>用户列表（{users.length}）</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{item.username}</Text>
                  <StatusTag status={item.status} />
                </View>
                {item.status === "pending" ? (
                  <View style={styles.actions}>
                    <Pressable
                      onPress={() => act(item.id, true)}
                      style={[styles.actBtn, styles.approveBtn]}>
                      <Text style={styles.approveText}>批准</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => act(item.id, false)}
                      style={[styles.actBtn, styles.rejectBtn]}>
                      <Text style={styles.rejectText}>拒绝</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}
          />
        )
      ) : null}
    </View>
  );
}

function StatusTag({ status }: { status: string }) {
  const cfg =
    status === "approved"
      ? { bg: "#14322A", fg: "#34D399", label: "已批准" }
      : status === "rejected"
        ? { bg: "#3A1F26", fg: Colors.light.favorite, label: "已拒绝" }
        : { bg: "#23324A", fg: Colors.light.secondary, label: "待审核" };
  return (
    <View style={[styles.statusTag, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusTagText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginLeft: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
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
  keyWrap: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  keyInput: {
    flex: 1,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.light.text,
  },
  keyBtnWrap: {
    borderRadius: Radii.md,
  },
  keyBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: Radii.md,
    justifyContent: "center",
  },
  keyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  center: {
    paddingVertical: 60,
    alignItems: "center",
  },
  list: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  listHeader: {
    fontSize: 13,
    color: Colors.light.textMuted,
    marginBottom: 8,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.light.line,
    padding: 12,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
  },
  statusTag: {
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  approveBtn: {
    borderColor: "#34D399",
  },
  approveText: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "600",
  },
  rejectBtn: {
    borderColor: Colors.light.favorite,
  },
  rejectText: {
    color: Colors.light.favorite,
    fontSize: 13,
    fontWeight: "600",
  },
});
