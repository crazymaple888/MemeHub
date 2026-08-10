import { Platform, Share } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { fileUrl } from "./types";

export async function downloadMeme(
  filePath: string,
  title: string
): Promise<{ ok: boolean; message: string }> {
  const url = fileUrl(filePath);
  if (!url) return { ok: false, message: "无下载地址" };
  const fileName = filePath.split("/").pop() || "meme.gif";

  if (Platform.OS === "web") {
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = title
        ? `${title}.${fileName.split(".").pop()}`
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
        mimeType: filePath.endsWith(".gif") ? "image/gif" : "image/png",
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
