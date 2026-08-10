import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  existsSync,
  statSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const UPLOADS = join(ROOT, "server", "uploads");
const CACHE = join(__dirname, ".cache");
mkdirSync(UPLOADS, { recursive: true });
mkdirSync(CACHE, { recursive: true });

const dbPath = join(ROOT, "server", "data", "meme.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// ---- config (env-tunable) ----
const MAX_PER_CATEGORY = Number(process.env.MAX_PER_CATEGORY || 40);
const MAX_TOTAL = Number(process.env.MAX_TOTAL || 1000);
const TARGET_CATEGORIES = Number(process.env.TARGET_CATEGORIES || 60);

const STICKERS_URL =
  "https://raw.githubusercontent.com/CST-Cat/capoo-vault/main/data/stickers.json";
const GIF_BASE = "https://raw.githubusercontent.com/CST-Cat/capoo-gallery/main/gifs";

const STICKERS_CACHE = join(CACHE, "stickers.json");

// ---- helpers ----
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_");
}

// 从贴纸包目录名中提取可读分类名
function categoryLabel(dirName: string): string {
  let s = dirName;
  s = s.replace(/^\d+[-_]/, "");
  s = s.replace(/[-_]by[_ ]?\w+$/i, "");
  s = s.replace(/[-_](?:pa|p|p2)_[a-z0-9_]+$/i, "");
  s = s.replace(/[-_]{2,}/g, "-");
  return s.trim() || dirName;
}

async function ensureStickers(): Promise<any[]> {
  if (existsSync(STICKERS_CACHE) && statSync(STICKERS_CACHE).size > 1000) {
    return JSON.parse(readFileSync(STICKERS_CACHE, "utf8"));
  }
  console.log("  downloading stickers.json ...");
  const data = await fetchJson(STICKERS_URL);
  writeFileSync(STICKERS_CACHE, JSON.stringify(data));
  return data;
}

async function downloadFile(url: string, dest: string): Promise<number> {
  if (existsSync(dest) && statSync(dest).size > 0) return statSync(dest).size;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return buf.length;
}

interface Sticker {
  gif: string;
  set: string;
  emotion: string;
  action: string;
  scene: string;
  description: string;
  tags: string[];
  path: string;
}

// ---- main ----
async function main() {
  console.log("[1/4] loading stickers.json...");
  const stickers = (await ensureStickers()) as Sticker[];
  console.log(`  total stickers: ${stickers.length}`);

  // group by set (category)
  const bySet = new Map<string, Sticker[]>();
  for (const s of stickers) {
    if (!bySet.has(s.set)) bySet.set(s.set, []);
    bySet.get(s.set)!.push(s);
  }
  const sets = [...bySet.keys()];
  console.log(`  categories (sets): ${sets.length}`);
  const selectedSets = sets.slice(0, Math.min(TARGET_CATEGORIES, sets.length));
  console.log(`  selected categories: ${selectedSets.length}`);

  console.log("[2/4] building rows...");
  interface Row extends Sticker {
    relDir: string;
    fileName: string;
    gifUrl: string;
  }
  const rows: Row[] = [];
  for (const set of selectedSets) {
    const stickersInSet = bySet.get(set)!;
    const relDir = safeName(set);
    const sampled = stickersInSet.slice(0, MAX_PER_CATEGORY);
    for (const s of sampled) {
      // sticker.path looks like "065-BugCat-.../001-file_1991.json"
      // gif path is same dir + s.gif
      const pathDir = s.path.includes("/") ? s.path.split("/")[0] : relDir;
      const fileName = s.gif;
      rows.push({
        ...s,
        relDir: safeName(pathDir),
        fileName,
        gifUrl: `${GIF_BASE}/${[pathDir, fileName].map(encodeURIComponent).join("/")}`,
      });
    }
    console.log(`  ${set}: ${sampled.length}`);
  }
  const capped = rows.slice(0, MAX_TOTAL);
  console.log(`  total rows: ${rows.length} (capped ${capped.length})`);

  console.log("[3/4] downloading gifs + inserting DB...");
  const catCacheFile = join(CACHE, "cat-cache.json");
  const catIdCache = new Map<string, number>();
  if (existsSync(catCacheFile)) {
    try {
      const obj = JSON.parse(readFileSync(catCacheFile, "utf8"));
      for (const [k, v] of Object.entries(obj)) catIdCache.set(k, v as number);
    } catch {}
  }
  let nextCatId = catIdCache.size + 1;

  const getCategoryId = (setName: string): number => {
    let id = catIdCache.get(setName);
    if (id !== undefined) return id;
    const slug = `cat-${nextCatId}`;
    const existing = db
      .prepare("SELECT id FROM categories WHERE slug = ?")
      .get(slug) as { id: number } | undefined;
    if (existing) {
      id = existing.id;
    } else {
      const r = db
        .prepare("INSERT INTO categories (name, slug) VALUES (?, ?)")
        .run(categoryLabel(setName), slug);
      id = Number(r.lastInsertRowid);
    }
    catIdCache.set(setName, id);
    nextCatId = Math.max(nextCatId, id + 1);
    return id;
  };

  const insertMeme = db.prepare(
    `INSERT INTO memes
      (title, description, tags, category_id, emotion, action, scene, file_path, thumb_path, file_type, size, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'gif', ?, 'seed')`
  );

  let done = 0;
  let skipped = 0;
  for (const row of capped) {
    const destDir = join(UPLOADS, row.relDir);
    const dest = join(destDir, row.fileName);

    const existing = db
      .prepare("SELECT id FROM memes WHERE file_path = ?")
      .get(`${row.relDir}/${row.fileName}`) as { id: number } | undefined;
    if (existing) {
      skipped++;
      done++;
      continue;
    }

    try {
      mkdirSync(destDir, { recursive: true });
      await downloadFile(row.gifUrl, dest);
    } catch (e: any) {
      console.log(`  download fail: ${row.gifUrl} (${e.message})`);
      continue;
    }

    const catId = getCategoryId(row.set);
    const size = statSync(dest).size;
    insertMeme.run(
      row.description || row.fileName.replace(/\.gif$/i, ""),
      row.description || "",
      JSON.stringify(row.tags || []),
      catId,
      row.emotion || "",
      row.action || "",
      row.scene || "",
      `${row.relDir}/${row.fileName}`,
      size
    );
    done++;
    if (done % 50 === 0) console.log(`  ... ${done}/${capped.length}`);
  }

  writeFileSync(
    catCacheFile,
    JSON.stringify(Object.fromEntries(catIdCache))
  );

  console.log(`[4/4] done. processed ${done} (skipped ${skipped}).`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
