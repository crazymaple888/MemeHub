export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  cover: string | null;
}

export interface Meme {
  id: number;
  title: string;
  description: string;
  tags: string[];
  categoryId: number;
  categoryName: string;
  emotion: string;
  action: string;
  scene: string;
  file: string | null;
  thumb: string | null;
  imageUrl: string | null;
  fileType: string;
  width: number | null;
  height: number | null;
  size: number | null;
  source: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const fileUrl = (p: string | null | undefined) =>
  p ? `${API_BASE}/files/${p}` : null;

// 图片显示优先级：外部热链 > 本地文件
export const imgSource = (meme: Meme) => meme.imageUrl ?? fileUrl(meme.file);
