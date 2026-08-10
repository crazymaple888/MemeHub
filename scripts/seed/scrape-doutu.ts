import { DatabaseSync } from "node:sqlite";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const dbPath = join(ROOT, "server", "data", "meme.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");

// 确保 image_url 列存在（与 server/src/db.ts 迁移一致）
const cols = db.prepare("PRAGMA table_info(memes)").all() as { name: string }[];
if (!cols.some((c) => c.name === "image_url")) {
  db.exec("ALTER TABLE memes ADD COLUMN image_url TEXT");
}

// ---- config (env-tunable) ----
const MAX_PAGES = Number(process.env.MAX_PAGES || 30);
const MAX_TOTAL = Number(process.env.MAX_TOTAL || 500);

const LIST_BASE = "https://www.doutupk.com/article/list/?page=";
const DETAIL_BASE = "https://www.doutupk.com/article/detail/";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// ---- helpers ----
async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

function absUrl(u: string): string {
  if (u.startsWith("//")) return `https:${u}`;
  return u;
}

// ---- main ----
async function main() {
  // 单一"斗图表情"分类
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
      (title, description, tags, category_id, emotion, action, scene, image_url, file_path, thumb_path, file_type, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 'seed')`
  );

  const seen = new Set<string>();
  db.prepare("SELECT image_url FROM memes WHERE image_url IS NOT NULL")
    .all()
    .forEach((r: any) => seen.add(r.image_url));

  let done = 0;
  let skipped = 0;

  for (let page = 1; page <= MAX_PAGES && done < MAX_TOTAL; page++) {
    console.log(`[page ${page}] fetching list...`);
    let listHtml: string;
    try {
      listHtml = await fetchHtml(`${LIST_BASE}${page}`);
    } catch (e: any) {
      console.log(`  list page ${page} fail: ${e.message}`);
      break;
    }

    // 文章详情链接
    const detailLinks = [
      ...new Set(
        [...listHtml.matchAll(/href="(https:\/\/www\.doutupk\.com\/article\/detail\/(\d+))"/g)].map(
          (m) => m[1]
        )
      ),
    ];
    console.log(`  detail links: ${detailLinks.length}`);

    for (const link of detailLinks) {
      if (done >= MAX_TOTAL) break;

      let detailHtml: string;
      try {
        detailHtml = await fetchHtml(link);
      } catch (e: any) {
        console.log(`  detail ${link} fail: ${e.message}`);
        continue;
      }

      // 大图 URL：详情页 <img src="http://img.doutupk.com/...">
      const imgs = detailHtml
        .matchAll(/<img[^>]+src="(http[^"]+)"/g)
        .map((m) => absUrl(m[1]))
        .filter((u) => u.includes("img.doutupk.com") && !u.includes("static"))
        .filter((u) => !seen.has(u));
      const imgsArr = [...new Set(imgs)];

      if (imgsArr.length === 0) continue;

      // 标题：h1
      const h1m = /<h1[^>]*>(.*?)<\/h1>/s.exec(detailHtml);
      const title = h1m ? cleanTitle(h1m[1]) : "";

      for (const url of imgsArr) {
        if (done >= MAX_TOTAL) break;
        insert.run(
          title || `斗图表情 ${done + 1}`,
          "",
          JSON.stringify(["斗图"]),
          catId!.id,
          "",
          "",
          "",
          url,
          "jpg"
        );
        seen.add(url);
        done++;
      }
      skipped += imgsArr.length;
      if (done % 50 === 0) console.log(`  ... ${done}/${MAX_TOTAL}`);
    }
  }

  console.log(`done. inserted ${done} (duplicates ${skipped - done}).`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
