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
  author?: User;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  clerkId: string;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  documentType?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED'
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