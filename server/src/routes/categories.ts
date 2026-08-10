import { Router } from "express";
import db from "../db.js";
import type { Category, Meme, Paginated } from "../types.js";

function mapMeme(row: any): Meme {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: JSON.parse(row.tags ?? "[]"),
    categoryId: row.category_id,
    categoryName: row.category_name ?? "",
    emotion: row.emotion ?? "",
    action: row.action ?? "",
    scene: row.scene ?? "",
    file: row.file_path,
    thumb: row.thumb_path ?? null,
    fileType: row.file_type,
    width: row.width,
    height: row.height,
    size: row.size,
    source: row.source,
    createdAt: row.created_at,
  };
}

export const categoriesRouter = Router();

categoriesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, COUNT(m.id) AS count, m.file_path AS cover
       FROM categories c
       LEFT JOIN memes m ON m.category_id = c.id
       GROUP BY c.id
       ORDER BY count DESC, c.id ASC`
    )
    .all() as any[];

  const categories: Category[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    count: r.count,
    cover: r.cover ?? null,
  }));

  res.json(categories);
});
