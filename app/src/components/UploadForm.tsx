import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "@/lib/api";
import { Colors, Radii } from "@/constants/theme";

export default function UploadForm() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pickedFileRef = useRef<{ uri: string; name: string; mime: string } | null>(null);

  const pickImage = useCallback(async () => {
    if (Platform.OS === "web") {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      pickedFileRef.current = {
        uri: asset.uri,
        name: asset.name ?? "upload.gif",
        mime: asset.mimeType ?? "image/gif",
      };
      setImageUri(asset.uri);
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("需要权限", "请允许访问相册后再上传");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (res.canceled) return;
    const asset = res.assets[0];
    const name = asset.fileName ?? `upload.${asset.mimeType?.split("/")[1] ?? "gif"}`;
    pickedFileRef.current = { uri: asset.uri, name, mime: asset.mimeType ?? "image/gif" };
    setImageUri(asset.uri);
  }, []);

  const submit = useCallback(async () => {
    if (!pickedFileRef.current) {
      Alert.alert("提示", "请先选择一张表情包图片");
      return;
    }
    if (!category.trim()) {
      Alert.alert("提示", "请填写分类名称");
      return;
    }
    setSubmitting(true);
    try {
      const { uri, name, mime } = pickedFileRef.current;
      const form = new FormData();
      // 兼容 web 与 native
      const fileBlob: any = {
        uri,
        name,
        type: mime,
      };
      form.append("file", fileBlob as any);
      form.append("title", title.trim() || "未命名表情包");
      form.append("description", description.trim());
      form.append("category", category.trim());
      form.append("tags", tags.trim());

      const res = await api.upload(form);
      Alert.alert("上传成功", "表情包已发布", [
        { text: "查看", onPress: () => router.push(`/meme/${res.id}`) },
        { text: "好的", style: "cancel" },
      ]);
      setImageUri(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setTags("");
      pickedFileRef.current = null;
    } catch (e: any) {
      Alert.alert("上传失败", e.message || "请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }, [title, description, category, tags, router]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}>
      <Pressable style={styles.picker} onPress={pickImage}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
            contentFit="contain"
          />
        ) : (
          <View style={styles.pickerEmpty}>
            <Text style={styles.pickerPlus}>＋</Text>
            <Text style={styles.pickerText}>点击选择表情包图片</Text>
            <Text style={styles.pickerHint}>支持 GIF / PNG / JPG / WEBP</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.label}>标题</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="表情包的名称（选填）"
          placeholderTextColor={Colors.light.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <Text style={styles.label}>分类 *</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="例如：搞笑 / 可爱 / 熊猫头..."
          placeholderTextColor={Colors.light.textMuted}
          value={category}
          onChangeText={setCategory}
        />
      </View>

      <Text style={styles.label}>标签</Text>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="用逗号分隔，例如：开心,可爱,上班"
          placeholderTextColor={Colors.light.textMuted}
          value={tags}
          onChangeText={setTags}
        />
      </View>

      <Text style={styles.label}>描述</Text>
      <View style={[styles.inputWrap, styles.multilineWrap]}>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="一句话描述这个表情包的场景（选填）"
          placeholderTextColor={Colors.light.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <Pressable
        onPress={submit}
        disabled={submitting}
        style={styles.submitWrap}>
        <LinearGradient
          colors={Colors.light.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.submit, submitting && styles.submitDisabled]}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>发布表情包</Text>
          )}
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  picker: {
    height: 220,
    borderRadius: Radii.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.line,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 20,
  },
  pickerEmpty: {
    alignItems: "center",
  },
  pickerPlus: {
    fontSize: 40,
    color: Colors.light.textMuted,
    lineHeight: 48,
  },
  pickerText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  pickerHint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  label: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: Colors.light.line,
    borderRadius: Radii.md,
    backgroundColor: Colors.light.surface,
    marginBottom: 16,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
  },
  multilineWrap: {
    minHeight: 70,
  },
  multiline: {
    minHeight: 68,
    textAlignVertical: "top",
  },
  submitWrap: {
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: "700",
  },
});
