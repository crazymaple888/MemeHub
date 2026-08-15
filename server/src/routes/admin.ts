import { Router } from "express";
import db from "../db.js";
import { findUserByToken } from "./auth.js";

const ADMIN_KEY = process.env.ADMIN_KEY || "memeadmin";

function isAdmin(req: { headers: Record<string, string | string[] | undefined> }): boolean {
  const key = req.headers["x-admin-key"];
  return typeof key === "string" && key === ADMIN_KEY;
}

export const adminRouter = Router();

adminRouter.use((req, res, next) => {
  if (!isAdmin(req)) {
    res.status(403).json({ error: "管理员密钥错误" });
    return;
  }
  next();
});

// 待审用户列表
adminRouter.get("/requests", (_req, res) => {
  const rows = db
    .prepare("SELECT id, username, status, created_at FROM users WHERE status = 'pending' ORDER BY id ASC")
    .all() as { id: number; username: string; status: string; created_at: string }[];
  res.json(rows);
});

// 所有用户（供概览）
adminRouter.get("/users", (_req, res) => {
  const rows = db
    .prepare("SELECT id, username, status, created_at FROM users ORDER BY id DESC")
    .all() as { id: number; username: string; status: string; created_at: string }[];
  res.json(rows);
});

// 批准上传权限
adminRouter.post("/approve/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "无效用户 ID" });
    return;
  }
  const info = db
    .prepare("UPDATE users SET status = 'approved' WHERE id = ?")
    .run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: "用户不存在" });
    return;
  }
  res.json({ ok: true });
});

// 拒绝
adminRouter.post("/reject/:id", (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "无效用户 ID" });
    return;
  }
  const info = db
    .prepare("UPDATE users SET status = 'rejected' WHERE id = ?")
    .run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: "用户不存在" });
    return;
  }
  res.json({ ok: true });
});

export { ADMIN_KEY, isAdmin };
