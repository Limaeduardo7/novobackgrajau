export interface Profissional {
  id: number;
  name: string;
  slug?: string;
  ocupacao: string;
  descricao?: string | null;
  foto?: string | null;
  endereco?: string | null;
  telefone?: string | null;
  estado: string;
  cidade: string;
  email?: string | null;
  website?: string | null;
  redes_sociais?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
  } | null;
  disponibilidade?: {
    segunda?: string | null;
    terca?: string | null;
    quarta?: string | null;
    quinta?: string | null;
    sexta?: string | null;
    sabado?: string | null;
    domingo?: string | null;
  } | null;
  is_featured: boolean;
  avaliacao?: number | null;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  user_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ProfissionalParams {
  page?: number;
  limit?: number;
  ocupacao?: string;
  estado?: string;
  cidade?: string;
  search?: string;
  featured?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: 'APPROVED' | 'REJECTED' | 'PENDING' | 'ALL';
}

export interface SingleProfissionalResponse {
  data: Profissional;
  message?: string;
}

export interface PaginatedProfissionalResponse {
  data: Profissional[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
} 