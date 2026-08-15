import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import db from "../db.js";
import { findUserByToken } from "./auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const uploadsDir = join(__dirname, "..", "..", "uploads");
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase() || ".gif";
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(gif|png|jpe?g|webp)/.test(file.mimetype);
    if (!ok) cb(new Error("仅支持 gif/png/jpg/webp 图片"));
    else cb(null, true);
  },
});

const ALLOWED_EXT = new Set([".gif", ".png", ".jpg", ".jpeg", ".webp"]);

export const uploadRouter = Router();

uploadRouter.post("/", upload.single("file"), async (req, res) => {
  // 鉴权：需要已批准上传权限的用户
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const user = findUserByToken(token);
  if (!user) {
    res.status(401).json({ error: "请先登录" });
    return;
  }
  if (user.status !== "approved") {
    res.status(403).json({ error: "上传权限未开通，请等待管理员审核" });
    return;
  }

  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "缺少文件字段 file" });
    return;
  }
  const ext = extname(file.filename).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    res.status(400).json({ error: "不支持的文件类型" });
    return;
  }

  const title = (req.body.title as string)?.trim() || "未命名表情包";
  const categoryName = (req.body.category as string)?.trim() || "其他";
  const tagsRaw = (req.body.tags as string)?.trim() || "";
  const tags = tagsRaw
    .split(/[,，\s]+/)
    .filter(Boolean)
    .slice(0, 10);

  try {
    const meta = await sharp(file.path).metadata();
    let thumbPath = null;
    if (ext === ".gif" && meta.pages && meta.pages > 1) {
      // GIF 静态缩略图：取第一帧
      try {
        const thumbName = `${file.filename.split(".")[0]}.jpg`;
        await sharp(file.path, { animated: false })
          .resize(400, 400, { fit: "inside" })
          .jpeg({ quality: 75 })
          .toFile(join(uploadsDir, thumbName));
        thumbPath = thumbName;
      } catch {
        thumbPath = file.filename;
      }
    } else {
      try {
        const thumbName = `${file.filename.split(".")[0]}.jpg`;
        await sharp(file.path)
          .resize(400, 400, { fit: "inside" })
          .jpeg({ quality: 75 })
          .toFile(join(uploadsDir, thumbName));
        thumbPath = thumbName;
      } catch {
        thumbPath = file.filename;
      }
    }

    // upsert category
    let catId: number;
    const existing = db
      .prepare("SELECT id FROM categories WHERE name = ?")
      .get(categoryName) as { id: number } | undefined;
    if (existing) {
      catId = existing.id;
    } else {
      const slug = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const info = db
        .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
        .run(categoryName, slug);
      catId = Number(info.lastInsertRowid);
    }

    const info = db
      .prepare(
        `INSERT INTO memes
          (title, description, tags, category_id, file_path, thumb_path, file_type, width, height, size, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'upload')`
      )
      .run(
        title,
        (req.body.description as string)?.trim() || "",
        JSON.stringify(tags),
        catId,
        file.filename,
        thumbPath,
        ext.replace(".", ""),
        meta.width ?? null,
        meta.height ?? null,
        file.size
      );

    // 记录上传用户
    db.prepare("UPDATE memes SET user_id = ? WHERE id = ?").run(user.id, Number(info.lastInsertRowid));

    res.status(201).json({ id: Number(info.lastInsertRowid), thumb: thumbPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
