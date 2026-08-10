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
import { fileUrl } from "@/lib/types";

export default function UploadScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [mime, setMime] = useState("image/gif");
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
      setFileName(asset.name ?? "");
      setMime(asset.mimeType ?? "image/gif");
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
    setFileName(name);
    setMime(asset.mimeType ?? "image/gif");
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
      <TextInput
        style={styles.input}
        placeholder="表情包的名称（选填）"
        placeholderTextColor="#999"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>分类 *</Text>
      <TextInput
        style={styles.input}
        placeholder="例如：搞笑 / 可爱 / 熊猫头..."
        placeholderTextColor="#999"
        value={category}
        onChangeText={setCategory}
      />

      <Text style={styles.label}>标签</Text>
      <TextInput
        style={styles.input}
        placeholder="用逗号分隔，例如：开心,可爱,上班"
        placeholderTextColor="#999"
        value={tags}
        onChangeText={setTags}
      />

      <Text style={styles.label}>描述</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="一句话描述这个表情包的场景（选填）"
        placeholderTextColor="#999"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Pressable
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={submit}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>发布表情包</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  picker: {
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f7f8fa",
    borderWidth: 1,
    borderColor: "#e5e6e8",
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
    color: "#bbb",
    lineHeight: 48,
  },
  pickerText: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  pickerHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#aaa",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  label: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e6e8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  submit: {
    marginTop: 8,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4F7CFF",
    justifyContent: "center",
    alignItems: "center",
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
