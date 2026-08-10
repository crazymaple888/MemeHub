import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { fileUrl, type Meme } from "./types";

// meme 可能来自外部热链（imageUrl）或本地上传（file）
export async function downloadMeme(
  meme: Pick<Meme, "imageUrl" | "file">,
  title: string
): Promise<{ ok: boolean; message: string }> {
  const url = meme.imageUrl ?? fileUrl(meme.file);
  if (!url) return { ok: false, message: "无下载地址" };
  const filePath = meme.file;
  const ext = url.split(".").pop()?.split("?")[0] || "jpg";
  const fileName = filePath?.split("/").pop() || `meme.${ext}`;

  if (Platform.OS === "web") {
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = title
        ? `${title}.${ext}`
        : fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      return { ok: true, message: "已开始下载" };
    } catch (e: any) {
      return { ok: false, message: e.message || "下载失败" };
    }
  }

  // native
  try {
    const dest = new File(Paths.cache, fileName);
    await File.downloadFileAsync(url, dest, { idempotent: true });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dest.uri, {
        mimeType: ext === "gif" ? "image/gif" : "image/jpeg",
        dialogTitle: "保存表情包",
        UTI: "public.image",
      });
      return { ok: true, message: "已通过系统分享保存" };
    }
    return { ok: true, message: `已下载到 ${dest.uri}` };
  } catch (e: any) {
    return { ok: false, message: e.message || "下载失败" };
  }
}
