// 通用的Post类型定义
export type Post = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  createdAt: string;
  pinned?: number | boolean;
  author?: {
    id: number;
    email: string | null;
  };
  category?: {
    id: number;
    name: string | null;
    slug: string | null;
  };
  tags?: {
    id: number;
    name: string;
    slug: string;
  }[];
};

// 其他类型定义可以在此添加
