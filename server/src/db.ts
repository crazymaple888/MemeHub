import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(join(dataDir, "meme.db"));
db.exec("PRAGMA journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    slug      TEXT NOT NULL UNIQUE,
    cover_id  INTEGER
  );

  CREATE TABLE IF NOT EXISTS memes (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT DEFAULT '',
    tags        TEXT NOT NULL DEFAULT '[]',
    category_id INTEGER NOT NULL REFERENCES categories(id),
    emotion     TEXT DEFAULT '',
    action      TEXT DEFAULT '',
    scene       TEXT DEFAULT '',
    file_path   TEXT NOT NULL,
    thumb_path  TEXT,
    file_type   TEXT NOT NULL DEFAULT 'gif',
    width       INTEGER,
    height      INTEGER,
    size        INTEGER,
    source      TEXT NOT NULL DEFAULT 'seed',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_memes_category ON memes(category_id);
  CREATE INDEX IF NOT EXISTS idx_memes_created ON memes(created_at DESC);
`);

export interface CategoryRow {
  id: number;
  name: string;
  slug: string;
  cover_id: number | null;
}

export interface MemeRow {
  id: number;
  title: string;
  description: string;
  tags: string;
  category_id: number;
  emotion: string;
  action: string;
  scene: string;
  file_path: string;
  thumb_path: string | null;
  file_type: string;
  width: number | null;
  height: number | null;
  size: number | null;
  source: string;
  created_at: string;
}

export default db;
