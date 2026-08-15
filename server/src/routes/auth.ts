import { Router } from "express";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import db, { type UserRow } from "../db.js";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const calc = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return calc.length === expected.length && timingSafeEqual(calc, expected);
}

// 通过 Bearer token 解析用户
export function findUserByToken(token: string): UserPublic | null {
  if (!token) return null;
  const row = db
    .prepare("SELECT * FROM users WHERE token = ?")
    .get(token) as UserRow | undefined;
  return row ? toPublic(row) : null;
}

export interface UserPublic {
  id: number;
  username: string;
  status: string;
  token: string;
  createdAt: string;
}

function toPublic(row: UserRow): UserPublic {
  return {
    id: row.id,
    username: row.username,
    status: row.status,
    token: row.token ?? "",
    createdAt: row.created_at,
  };
}

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const username = (req.body?.username as string)?.trim() || "";
  const password = (req.body?.password as string) || "";
  if (username.length < 2 || username.length > 24) {
    res.status(400).json({ error: "用户名需 2-24 个字符" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密码至少 6 位" });
    return;
  }
  const exists = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: number } | undefined;
  if (exists) {
    res.status(409).json({ error: "用户名已被占用" });
    return;
  }
  const token = randomUUID();
  const info = db
    .prepare(
      "INSERT INTO users (username, password_hash, status, token) VALUES (?, ?, 'pending', ?)"
    )
    .run(username, hashPassword(password), token);
  const user = toPublic({
    id: Number(info.lastInsertRowid),
    username,
    password_hash: "",
    status: "pending",
    token,
    created_at: "",
  });
  res.status(201).json(user);
});

authRouter.post("/login", (req, res) => {
  const username = (req.body?.username as string)?.trim() || "";
  const password = (req.body?.password as string) || "";
  const row = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username) as UserRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: "用户名或密码错误" });
    return;
  }
  const token = randomUUID();
  db.prepare("UPDATE users SET token = ? WHERE id = ?").run(token, row.id);
  res.json(toPublic({ ...row, token }));
});

authRouter.get("/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const user = findUserByToken(token);
  if (!user) {
    res.status(401).json({ error: "未登录" });
    return;
  }
  res.json(user);
});
