import { Router } from "express";
import db from "../db.js";
import type { Meme, Paginated } from "../types.js";

const memoizedMap = (row: any): Meme => {
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
    file: row.file_path ?? null,
    thumb: row.thumb_path ?? null,
    imageUrl: row.image_url ?? null,
    fileType: row.file_type,
    width: row.width,
    height: row.height,
    size: row.size,
    source: row.source,
    createdAt: row.created_at,
  };
};

export const memesRouter = Router();

const SELECT = `
  SELECT m.*, c.name AS category_name
  FROM memes m
  JOIN categories c ON c.id = m.category_id
`;

memesRouter.get("/", (req, res) => {
  const category = req.query.category as string | undefined;
  const query = (req.query.query as string | undefined)?.trim() || "";
  const tag = (req.query.tag as string | undefined)?.trim() || "";
  const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
  const pageSize = Math.min(
    60,
    Math.max(1, parseInt((req.query.pageSize as string) || "20", 10))
  );

  const where: string[] = [];
  const params: any[] = [];

  if (category && category !== "all") {
    where.push("c.slug = ?");
    params.push(category);
  }
  if (query) {
    where.push(
      "(m.title LIKE ? OR m.description LIKE ? OR m.emotion LIKE ? OR m.action LIKE ? OR m.tags LIKE ?)"
    );
    const like = `%${query}%`;
    params.push(like, like, like, like, like);
  }
  if (tag) {
    where.push("m.tags LIKE ?");
    params.push(`%"${tag}"%`);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countRow = db
    .prepare(`SELECT COUNT(*) AS total FROM memes m ${whereSql}`)
    .get(...params) as { total: number };

  const rows = db
    .prepare(
      `${SELECT} ${whereSql} ORDER BY m.created_at DESC, m.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize) as any[];

  const totalPages = Math.max(1, Math.ceil(countRow.total / pageSize));
  const result: Paginated<Meme> = {
    items: rows.map(memoizedMap),
    page,
    pageSize,
    total: countRow.total,
    totalPages,
  };
  res.json(result);
});

memesRouter.get("/random", (_req, res) => {
  const row = db
    .prepare(`${SELECT} ORDER BY RANDOM() LIMIT 1`)
    .get() as any | undefined;
  if (!row) {
    res.status(404).json({ error: "no memes yet" });
    return;
  }
  res.json(memoizedMap(row));
});

memesRouter.get("/:id(\\d+)", (req, res) => {
  const row = db.prepare(`${SELECT} WHERE m.id = ?`).get(req.params.id) as
    | any
    | undefined;
  if (!row) {
    res.status(404).json({ error: "meme not found" });
    return;
  }
  res.json(memoizedMap(row));
});
