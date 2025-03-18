export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  image?: string;
  published: boolean;
  publishedAt?: Date;
  featured: boolean;
  authorId: string;
  categoryId: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  published?: boolean;
  featured?: boolean;
  categoryId?: string;
  authorId?: string;
  search?: string;
  tags?: string[];
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

export interface SingleResponse<T> {
  data: T;
  message?: string;
} 