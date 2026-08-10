import { DatabaseSync } from "node:sqlite";
import {
  copyFileSync,
  mkdirSync,
  existsSync,
  statSync,
  readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const UPLOADS = join(ROOT, "server", "uploads");
const SRC_DIR = process.env.SRC_DIR || join(ROOT, ".tmp", "expr-clone", "img");

const dbPath = join(ROOT, "server", "data", "meme.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

const MAX = Number(process.env.MAX || 3000);

// ---- main ----
async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`SRC_DIR not found: ${SRC_DIR}`);
    console.error("请先运行稀疏检出：git clone --depth 1 --filter=blob:none --sparse ...");
    process.exit(1);
  }

  const files = readdirSync(SRC_DIR)
    .filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f))
    .slice(0, MAX);
  console.log(`source files: ${files.length}`);

  // 单一"斗图"分类
  const destDir = join(UPLOADS, "doutu");
  mkdirSync(destDir, { recursive: true });

  let catId = db
    .prepare("SELECT id FROM categories WHERE slug = ?")
    .get("doutu") as { id: number } | undefined;
  if (!catId) {
    const r = db
      .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
      .run("斗图表情", "doutu");
    catId = { id: Number(r.lastInsertRowid) };
  }

  const insert = db.prepare(
    `INSERT OR IGNORE INTO memes
      (title, description, tags, category_id, emotion, action, scene, file_path, thumb_path, file_type, size, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, 'seed')`
  );

  let done = 0;
  let skipped = 0;
  for (const f of files) {
    const src = join(SRC_DIR, f);
    const base = f.replace(/\.(jpg|jpeg|png|gif)$/i, "");
    const destName = `${base}.jpg`; // keep as-is; sharp handles real format
    const dest = join(destDir, destName);

    if (!existsSync(src)) continue;
    const existing = db
      .prepare("SELECT id FROM memes WHERE file_path = ?")
      .get(`doutu/${destName}`) as { id: number } | undefined;
    if (existing) {
      skipped++;
      continue;
    }

    copyFileSync(src, dest);
    const size = statSync(dest).size;

    // 用文件名做标题（诚实元数据），无语义标注
    const title = `斗图表情 ${base}`;
    insert.run(
      title,
      "",
      JSON.stringify(["斗图"]),
      catId.id,
      "",
      "",
      "",
      `doutu/${destName}`,
      "jpg",
      size
    );
    done++;
    if (done % 200 === 0) console.log(`  ... ${done}/${files.length}`);
  }

  console.log(`done. inserted ${done} (skipped ${skipped}).`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
