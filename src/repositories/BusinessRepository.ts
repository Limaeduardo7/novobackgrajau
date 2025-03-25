import { supabase, handleSupabaseError } from '../lib/supabase';
import { Business, BusinessStatus } from '../types/job.types';
import { Database } from '../types/supabase';

type BusinessRow = Database['public']['Tables']['empresas']['Row'];

export class BusinessRepository {
  /**
   * Obtém uma empresa pelo ID
   */
  async getById(id: string): Promise<Business | null> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        return handleSupabaseError(error);
      }
      
      return this.mapBusinessRowToBusiness(data);
    } catch (error) {
      console.error(`Erro ao buscar empresa com ID: ${id}`, error);
      throw error;
    }
  }
  
  /**
   * Mapeia registro do banco para o modelo de negócio
   */
  private mapBusinessRowToBusiness(data: BusinessRow): Business {
    return {
      id: String(data.id), // Convertendo para string para manter compatibilidade com o tipo
      name: data.name,
      logo: data.image || undefined,
      description: data.description || undefined,
      website: data.website || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      city: data.city,
      state: data.state,
      status: data.status as unknown as BusinessStatus,
      userId: '' // Como não temos user_id na tabela empresas, utilizamos string vazia por padrão
    };
  }
} 