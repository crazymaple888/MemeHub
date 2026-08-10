export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  cover?: string | null;
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
  file: string;
  thumb: string | null;
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
