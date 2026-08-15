import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, ApiError } from "@/lib/api";
import { getToken, setAuth, clearAuth, type AuthUser } from "@/lib/auth";
import { Colors, Radii } from "@/constants/theme";

export default function MeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      await clearAuth();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const submitAuth = useCallback(async () => {
    const u = username.trim();
    if (u.length < 2) {
      Alert.alert("提示", "用户名至少 2 个字符");
      return;
    }
    if (password.length < 6) {
      Alert.alert("提示", "密码至少 6 位");
      return;
    }
    setSubmitting(true);
    try {
      const res = mode === "login" ? await api.login({ username: u, password }) : await api.register({ username: u, password });
      await setAuth(res);
      setUser(res);
      setPassword("");
    } catch (e: any) {
      Alert.alert(mode === "login" ? "登录失败" : "注册失败", e.message || "请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }, [mode, username, password]);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
      </View>
    );
  }

  // 未登录：登录/注册
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.authContent}>
        <View style={styles.authHeader}>
          <View style={styles.logo}>
            <Ionicons name="person" size={28} color="#fff" />
          </View>
          <Text style={styles.authTitle}>{mode === "login" ? "欢迎回来" : "创建账号"}</Text>
          <Text style={styles.authSub}>
            {mode === "login" ? "登录后查看你的上传权限状态" : "注册后需管理员审核才能上传"}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor={Colors.light.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="密码（至少 6 位）"
            placeholderTextColor={Colors.light.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Pressable onPress={submitAuth} disabled={submitting} style={styles.submitWrap}>
          <LinearGradient
            colors={Colors.light.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submit, submitting && styles.submitDisabled]}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{mode === "login" ? "登录" : "注册并申请上传权限"}</Text>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => setMode(mode === "login" ? "register" : "login")}
          style={styles.switchBtn}>
          <Text style={styles.switchText}>
            {mode === "login" ? "还没有账号？去注册" : "已有账号？去登录"}
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  // 已登录
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userCard}>
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{user.username}</Text>
            <StatusBadge status={user.status} />
          </View>
          <Pressable onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>退出</Text>
          </Pressable>
        </View>
      </View>

      {user.status === "pending" ? (
        <View style={styles.statusCard}>
          <Ionicons name="hourglass-outline" size={32} color={Colors.light.secondary} />
          <Text style={styles.statusTitle}>权限申请中</Text>
          <Text style={styles.statusDesc}>你的上传权限正在等待管理员审核，通过后即可上传表情包。</Text>
        </View>
      ) : user.status === "rejected" ? (
        <View style={styles.statusCard}>
          <Ionicons name="close-circle-outline" size={32} color={Colors.light.favorite} />
          <Text style={styles.statusTitle}>权限被拒绝</Text>
          <Text style={styles.statusDesc}>你的上传申请未通过审核，暂时无法上传表情包。</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => router.push("/upload")}
          style={({ pressed }) => [styles.uploadEntry, pressed && { opacity: 0.85 }]}>
          <View style={styles.uploadEntryIcon}>
            <Ionicons name="cloud-upload" size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadEntryTitle}>发布表情包</Text>
            <Text style={styles.uploadEntryDesc}>分享一张新的斗图表情</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
        </Pressable>
      )}

      {/* 管理员入口 */}
      <Pressable
        onPress={() => router.push("/review")}
        style={({ pressed }) => [styles.adminEntry, pressed && { opacity: 0.8 }]}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.light.primary} />
        <Text style={styles.adminEntryText}>管理员审核入口</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.light.textMuted} />
      </Pressable>
    </ScrollView>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === "approved"
      ? { bg: "#14322A", fg: "#34D399" }
      : status === "rejected"
        ? { bg: "#3A1F26", fg: Colors.light.favorite }
        : { bg: "#23324A", fg: Colors.light.secondary };
  const label =
    status === "approved" ? "已开通上传" : status === "rejected" ? "已被拒绝" : "待审核";
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
  },
  authContent: {
    padding: 20,
    paddingTop: 48,
  },
  authHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: Radii.xl,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
  },
  authSub: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: Colors.light.line,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surface,
    marginBottom: 14,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  submitWrap: {
    marginTop: 6,
    borderRadius: Radii.pill,
  },
  submit: {
    height: 48,
    borderRadius: Radii.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  switchBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  switchText: {
    color: Colors.light.primary,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  userCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.line,
    padding: 16,
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.line,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  logoutText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  statusCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.line,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  statusDesc: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  uploadEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.line,
    padding: 14,
    marginBottom: 16,
  },
  uploadEntryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.gradient[0],
  },
  uploadEntryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.light.text,
  },
  uploadEntryDesc: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  adminEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.line,
    padding: 14,
  },
  adminEntryText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
});
