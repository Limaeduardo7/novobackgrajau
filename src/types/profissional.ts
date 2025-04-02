export interface Profissional {
  id: string;
  user_id?: string | null;
  nome: string;
  ocupacao: string;
  especialidades: string[];
  experiencia: string;
  educacao: string[];
  certificacoes?: string[] | null;
  portfolio?: string[] | null;
  disponibilidade: string;
  valor_hora?: number | null;
  sobre: string;
  foto?: string | null;
  telefone: string;
  email: string;
  website?: string | null;
  endereco?: string | null;
  cidade: string;
  estado: string;
  social_media?: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
    whatsapp?: string | null;
    outro?: string | null;
  } | null;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  rejectionReason?: string | null;
  featured: boolean;
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