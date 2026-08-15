import { API_BASE, type Meme, type Paginated, type Category } from "./types";
import { getToken, getAdminKey, type AuthUser } from "./auth";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) || {}),
  };
  // 注入用户 token
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // 注入管理员密钥
  const adminKey = await getAdminKey();
  if (adminKey) headers["X-Admin-Key"] = adminKey;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export interface MemeListParams {
  category?: string;
  query?: string;
  tag?: string;
  page?: number;
  pageSize?: number;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AdminUser {
  id: number;
  username: string;
  status: string;
  created_at: string;
}

export const api = {
  categories: () =>
    request<Category[]>("/api/categories"),

  memes: (params: MemeListParams = {}) => {
    const qs = new URLSearchParams();
    if (params.category && params.category !== "all")
      qs.set("category", params.category);
    if (params.query) qs.set("query", params.query);
    if (params.tag) qs.set("tag", params.tag);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    return request<Paginated<Meme>>(`/api/memes?${qs.toString()}`);
  },

  meme: (id: number) => request<Meme>(`/api/memes/${id}`),

  random: () => request<Meme>("/api/memes/random"),

  upload: (form: FormData) =>
    request<{ id: number; thumb: string | null }>("/api/upload", {
      method: "POST",
      body: form,
    }),

  // ---- auth ----
  register: (payload: AuthRequest) =>
    request<AuthUser>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  login: (payload: AuthRequest) =>
    request<AuthUser>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  me: () => request<AuthUser>("/api/auth/me"),

  // ---- admin ----
  adminRequests: () =>
    request<AdminUser[]>("/api/admin/requests"),

  adminUsers: () =>
    request<AdminUser[]>("/api/admin/users"),

  adminApprove: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/approve/${id}`, { method: "POST" }),

  adminReject: (id: number) =>
    request<{ ok: boolean }>(`/api/admin/reject/${id}`, { method: "POST" }),
};
