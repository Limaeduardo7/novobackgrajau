import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/error-handler';
import { PaginatedResponse } from '../types/common';
import { 
  JobApplication, 
  JobApplicationInsert, 
  JobApplicationListParams, 
  JobApplicationUpdateParams 
} from '../types/job-application.types';

export class JobApplicationRepository {
  /**
   * Lista candidaturas com filtros e paginação
   */
  async list({
    page = 1,
    limit = 10,
    status,
    jobId,
    professionalId
  }: JobApplicationListParams): Promise<PaginatedResponse<JobApplication>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from('job_applications')
        .select('*', { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }

      // Não mostrar registros deletados
      query = query.is('deleted_at', null);

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        return handleSupabaseError(error);
      }

      return {
        data: data as JobApplication[],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao listar candidaturas:', error);
      throw error;
    }
  }

  /**
   * Obtém uma candidatura por ID
   */
  async getById(id: string): Promise<JobApplication | null> {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return data as JobApplication;
    } catch (error) {
      console.error(`Erro ao buscar candidatura: ${id}`, error);
      throw error;
    }
  }

  /**
   * Cria uma nova candidatura
   */
  async create(data: JobApplicationInsert): Promise<JobApplication> {
    try {
      const { data: newApplication, error } = await supabase
        .from('job_applications')
        .insert(data)
        .select('*')
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return newApplication as JobApplication;
    } catch (error) {
      console.error('Erro ao criar candidatura:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma candidatura existente
   */
  async update(id: string, data: JobApplicationUpdateParams): Promise<JobApplication> {
    try {
      const { data: updatedApplication, error } = await supabase
        .from('job_applications')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return handleSupabaseError(error);
      }

      return updatedApplication as JobApplication;
    } catch (error) {
      console.error(`Erro ao atualizar candidatura: ${id}`, error);
      throw error;
    }
  }

  /**
   * Exclui uma candidatura (soft delete)
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return handleSupabaseError(error);
      }
    } catch (error) {
      console.error(`Erro ao excluir candidatura: ${id}`, error);
      throw error;
    }
  }
} 