import { supabase, handleSupabaseError } from '../lib/supabase';
import { Job, JobCreateParams, JobListParams, JobStatus, JobUpdateParams, PaginatedResponse } from '../types/job.types';
import { Database } from '../types/supabase';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type JobUpdate = Database['public']['Tables']['jobs']['Update'];

export class JobRepository {
  /**
   * Lista vagas com filtros e paginação
   */
  async list({
    page,
    limit,
    status = JobStatus.APPROVED,
    featured,
    businessId,
    search,
    location,
    type
  }: JobListParams): Promise<PaginatedResponse<Job>> {
    try {
      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Construir a consulta com base nos filtros
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (featured !== undefined) {
        query = query.eq('featured', featured);
      }
      
      if (businessId) {
        query = query.eq('business_id', businessId);
      }
      
      if (location) {
        query = query.ilike('location', `%${location}%`);
      }
      
      if (type) {
        query = query.ilike('type', `%${type}%`);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      // Adicionar verificação de expiração para vagas aprovadas
      if (status === JobStatus.APPROVED) {
        // Em SQL seria: WHERE (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        const currentDate = new Date().toISOString();
        query = query.or(`expires_at.is.null,expires_at.gt.${currentDate}`);
      }
      
      // Aplicar ordenação e paginação
      const { data, count, error } = await query
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Como não temos acesso ao business aqui, vamos buscar os IDs de empresas para buscar depois
      const jobsWithoutBusiness = data.map(this.mapJobRowToJob) as Job[];
      
      return {
        data: jobsWithoutBusiness,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao listar vagas:', error);
      throw error;
    }
  }

  /**
   * Obtém uma vaga pelo ID
   */
  async getById(id: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        return handleSupabaseError(error);
      }
      
      // Buscar a empresa separadamente
      const job = this.mapJobRowToJob(data) as Job;
      
      if (job.businessId) {
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', job.businessId)
            .single();
            
          if (!businessError && businessData) {
            job.business = {
              id: String(businessData.id),
              name: businessData.name,
              logo: businessData.image || undefined,
              description: businessData.description || undefined,
              website: businessData.website || undefined,
              email: businessData.email || undefined,
              phone: businessData.phone || undefined,
              city: businessData.city,
              state: businessData.state,
              status: businessData.status as any,
              userId: ''
            };
          }
        } catch (businessError) {
          console.error(`Erro ao buscar empresa da vaga: ${job.businessId}`, businessError);
          // Não falhar a requisição principal se não conseguir obter a empresa
        }
      }
      
      return job;
    } catch (error) {
      console.error(`Erro ao buscar vaga por ID: ${id}`, error);
      throw error;
    }
  }

  /**
   * Cria uma nova vaga
   */
  async create(data: JobCreateParams): Promise<Job> {
    try {
      // Em ambiente de desenvolvimento, vamos gerar um UUID válido quando o businessId não for um UUID
      let validBusinessId = data.businessId;
      
      if (process.env.NODE_ENV === 'development') {
        // Verifica se o ID fornecido é um UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(validBusinessId)) {
          // Se não for, gera um UUID v4 aleatório
          const crypto = require('crypto');
          validBusinessId = crypto.randomUUID();
          console.log(`[JOB] Convertendo businessId '${data.businessId}' para UUID válido: ${validBusinessId}`);
        }
      }
      
      // Preparando dados conforme o tipo do Prisma/Supabase (nomes em snake_case para o banco)
      const jobData: Omit<JobInsert, "createdAt" | "updatedAt" | "expiresAt"> & {
        created_at?: string;
        updated_at?: string;
        expires_at?: string | null;
      } = {
        title: data.title,
        description: data.description,
        requirements: data.requirements || [],
        benefits: data.benefits || [],
        salary: data.salary,
        type: data.type,
        location: data.location,
        business_id: validBusinessId, // Agora usando o UUID válido
        expires_at: data.expiresAt || null,
        tags: data.tags || [],
        status: JobStatus.PENDING, // Todas as vagas começam como pendentes
        featured: false,
        views: 0,
        applications: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert(jobData)
        .select('*')
        .single();
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Buscar a empresa separadamente
      const job = this.mapJobRowToJob(newJob) as Job;
      
      if (job.businessId) {
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', job.businessId)
            .single();
            
          if (!businessError && businessData) {
            job.business = {
              id: String(businessData.id),
              name: businessData.name,
              logo: businessData.image || undefined,
              description: businessData.description || undefined,
              website: businessData.website || undefined,
              email: businessData.email || undefined,
              phone: businessData.phone || undefined,
              city: businessData.city,
              state: businessData.state,
              status: businessData.status as any,
              userId: ''
            };
          }
        } catch (businessError) {
          console.error(`Erro ao buscar empresa da vaga: ${job.businessId}`, businessError);
        }
      }
      
      return job;
    } catch (error) {
      console.error('Erro ao criar vaga:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma vaga existente
   */
  async update(id: string, data: JobUpdateParams): Promise<Job> {
    try {
      const jobData: Omit<JobUpdate, "updatedAt" | "expiresAt"> & {
        updated_at: string;
        expires_at?: string | null;
      } = {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.requirements && { requirements: data.requirements }),
        ...(data.benefits && { benefits: data.benefits }),
        ...(data.salary && { salary: data.salary }),
        ...(data.type && { type: data.type }),
        ...(data.location && { location: data.location }),
        ...(data.expiresAt && { expires_at: data.expiresAt }),
        ...(data.tags && { tags: data.tags }),
        status: JobStatus.PENDING, // Retorna para pendente após edição
        updated_at: new Date().toISOString()
      };
      
      // Convertendo as chaves em camelCase para snake_case quando necessário
      const dbColumnMap: Record<string, string> = {
        'businessId': 'business_id'
      };
      
      // Criando objeto para enviar ao Supabase
      const dbData: Record<string, any> = {};
      for (const key in jobData) {
        const dbKey = dbColumnMap[key] || key;
        dbData[dbKey] = (jobData as any)[key];
      }
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update(dbData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Buscar a empresa separadamente
      const job = this.mapJobRowToJob(updatedJob) as Job;
      
      if (job.businessId) {
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', job.businessId)
            .single();
            
          if (!businessError && businessData) {
            job.business = {
              id: String(businessData.id),
              name: businessData.name,
              logo: businessData.image || undefined,
              description: businessData.description || undefined,
              website: businessData.website || undefined,
              email: businessData.email || undefined,
              phone: businessData.phone || undefined,
              city: businessData.city,
              state: businessData.state,
              status: businessData.status as any,
              userId: ''
            };
          }
        } catch (businessError) {
          console.error(`Erro ao buscar empresa da vaga: ${job.businessId}`, businessError);
        }
      }
      
      return job;
    } catch (error) {
      console.error(`Erro ao atualizar vaga: ${id}`, error);
      throw error;
    }
  }

  /**
   * Exclui uma vaga
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', id);
      
      if (error) {
        return handleSupabaseError(error);
      }
    } catch (error) {
      console.error(`Erro ao excluir vaga: ${id}`, error);
      throw error;
    }
  }

  /**
   * Atualiza o status de uma vaga
   */
  async updateStatus(id: string, status: JobStatus): Promise<Job> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Buscar a empresa separadamente
      const job = this.mapJobRowToJob(data) as Job;
      
      if (job.businessId) {
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', job.businessId)
            .single();
            
          if (!businessError && businessData) {
            job.business = {
              id: String(businessData.id),
              name: businessData.name,
              logo: businessData.image || undefined,
              description: businessData.description || undefined,
              website: businessData.website || undefined,
              email: businessData.email || undefined,
              phone: businessData.phone || undefined,
              city: businessData.city,
              state: businessData.state,
              status: businessData.status as any,
              userId: ''
            };
          }
        } catch (businessError) {
          console.error(`Erro ao buscar empresa da vaga: ${job.businessId}`, businessError);
        }
      }
      
      return job;
    } catch (error) {
      console.error(`Erro ao atualizar status da vaga: ${id}`, error);
      throw error;
    }
  }

  /**
   * Marca ou desmarca uma vaga como destaque
   */
  async toggleFeatured(id: string, featured: boolean): Promise<Job> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update({ 
          featured,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Buscar a empresa separadamente
      const job = this.mapJobRowToJob(data) as Job;
      
      if (job.businessId) {
        try {
          const { data: businessData, error: businessError } = await supabase
            .from('empresas')
            .select('*')
            .eq('id', job.businessId)
            .single();
            
          if (!businessError && businessData) {
            job.business = {
              id: String(businessData.id),
              name: businessData.name,
              logo: businessData.image || undefined,
              description: businessData.description || undefined,
              website: businessData.website || undefined,
              email: businessData.email || undefined,
              phone: businessData.phone || undefined,
              city: businessData.city,
              state: businessData.state,
              status: businessData.status as any,
              userId: ''
            };
          }
        } catch (businessError) {
          console.error(`Erro ao buscar empresa da vaga: ${job.businessId}`, businessError);
        }
      }
      
      return job;
    } catch (error) {
      console.error(`Erro ao alterar destaque da vaga: ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtém vagas em destaque
   */
  async getFeatured(limit: number): Promise<Job[]> {
    try {
      const currentDate = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', JobStatus.APPROVED)
        .eq('featured', true)
        .or(`expires_at.is.null,expires_at.gt.${currentDate}`)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      // Mapear os registros e buscar empresas depois
      const jobs = data.map(this.mapJobRowToJob) as Job[];
      
      // Não vamos buscar as empresas para cada vaga em destaque para evitar muitas requisições
      // Isso pode ser implementado se necessário
      
      return jobs;
    } catch (error) {
      console.error('Erro ao buscar vagas em destaque:', error);
      throw error;
    }
  }

  /**
   * Incrementa o contador de visualizações
   */
  async incrementViews(id: string): Promise<void> {
    try {
      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('views')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        return handleSupabaseError(fetchError);
      }
      
      const newViews = (job.views || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ views: newViews })
        .eq('id', id);
      
      if (updateError) {
        return handleSupabaseError(updateError);
      }
    } catch (error) {
      console.error(`Erro ao incrementar visualizações: ${id}`, error);
      throw error;
    }
  }

  /**
   * Incrementa o contador de aplicações
   */
  async incrementApplications(id: string): Promise<void> {
    try {
      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('applications')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        return handleSupabaseError(fetchError);
      }
      
      const newApplications = (job.applications || 0) + 1;
      
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ applications: newApplications })
        .eq('id', id);
      
      if (updateError) {
        return handleSupabaseError(updateError);
      }
    } catch (error) {
      console.error(`Erro ao incrementar aplicações: ${id}`, error);
      throw error;
    }
  }

  /**
   * Obtém vagas de uma empresa específica
   */
  async getByBusiness(businessId: string, { page, limit, status }: { page: number; limit: number; status?: string }): Promise<PaginatedResponse<Job>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('business_id', businessId);
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      return {
        data: data.map(this.mapJobRowToJob) as Job[],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error(`Erro ao buscar vagas da empresa: ${businessId}`, error);
      throw error;
    }
  }

  /**
   * Mapeia registro do banco para o modelo de negócio
   */
  private mapJobRowToJob(data: any): Job {
    const job: Job = {
      id: data.id,
      title: data.title,
      description: data.description,
      requirements: data.requirements || [],
      benefits: data.benefits || [],
      salary: data.salary,
      type: data.type,
      location: data.location,
      status: data.status as JobStatus,
      featured: data.featured,
      businessId: data.business_id || data.businessId, // Mapeamento de business_id para businessId
      business: undefined, // Será preenchido separadamente, se necessário
      createdAt: new Date(data.created_at || data.createdAt),
      updatedAt: new Date(data.updated_at || data.updatedAt),
      expiresAt: data.expires_at || data.expiresAt ? new Date(data.expires_at || data.expiresAt) : undefined,
      views: data.views || 0,
      applications: data.applications || 0,
      tags: data.tags || []
    };
    
    return job;
  }
} 