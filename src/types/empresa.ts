export interface Empresa {
  id: number;
  name: string;
  slug?: string;
  category: string;
  description?: string | null;
  image?: string | null;
  address?: string | null;
  phone?: string | null;
  state: string;
  city: string;
  email?: string | null;
  website?: string | null;
  social_media?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  } | null;
  opening_hours?: {
    monday?: string | null;
    tuesday?: string | null;
    wednesday?: string | null;
    thursday?: string | null;
    friday?: string | null;
    saturday?: string | null;
    sunday?: string | null;
  } | null;
  is_featured: boolean;
  rating?: number | null;
  status: 'aprovado' | 'rejeitado' | 'pendente';
  rejectionReason?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface EmpresaParams {
  page?: number;
  limit?: number;
  category?: string;
  state?: string;
  city?: string;
  search?: string;
  featured?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: 'aprovado' | 'rejeitado' | 'pendente' | 'all';
}

export interface SingleEmpresaResponse {
  data: Empresa;
  message?: string;
}

export interface PaginatedEmpresaResponse {
  data: Empresa[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
} 