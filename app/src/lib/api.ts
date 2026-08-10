import { API_BASE, type Meme, type Paginated, type Category } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
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
};
