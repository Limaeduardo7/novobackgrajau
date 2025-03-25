import { supabase, handleSupabaseError } from '../lib/supabase';
import { Database } from '../types/supabase';
import { AppError } from '../utils/AppError';

/**
 * Repositório para operações relacionadas a profissionais
 * Implementa as chamadas às funções RPC do Supabase
 */
export class ProfissionalRepository {
  /**
   * Obtém o perfil do profissional autenticado usando função RPC
   * @returns Perfil do profissional do usuário autenticado
   */
  async getMyProfile() {
    try {
      const { data, error } = await supabase.rpc('get_my_professional_profile');
      
      if (error) {
        console.error('Erro ao buscar perfil profissional:', error);
        
        // Se for erro de perfil não encontrado
        if (error.message.includes('not found') || error.code === 'PGRST116') {
          throw new AppError(404, 'Perfil profissional não encontrado');
        }
        
        return handleSupabaseError(error);
      }
      
      // A função retorna um array, então pegamos o primeiro item
      if (data && data.length > 0) {
        return data[0];
      } else {
        throw new AppError(404, 'Perfil profissional não encontrado');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao buscar perfil profissional');
    }
  }

  /**
   * Obtém o perfil do profissional pelo ID do usuário
   * @param userId ID do usuário
   * @returns Perfil do profissional
   */
  async getByUserId(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_professional_by_user_id', { 
        p_user_id: userId 
      });
      
      if (error) {
        console.error('Erro ao buscar perfil por ID de usuário:', error);
        return handleSupabaseError(error);
      }
      
      // Retornar o primeiro resultado
      if (data && data.length > 0) {
        return data[0];
      } else {
        throw new AppError(404, 'Perfil profissional não encontrado');
      }
    } catch (error) {
      console.error(`Erro ao buscar perfil do profissional por ID de usuário: ${userId}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao buscar perfil profissional');
    }
  }

  /**
   * Cria um novo perfil profissional
   * @param data Dados do perfil
   * @returns Perfil criado
   */
  async create(data: any) {
    try {
      // Verificar se já existe um perfil para este usuário
      const { data: existingProfile, error: checkError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', data.user_id)
        .single();
      
      if (existingProfile) {
        throw new AppError(400, 'Usuário já possui um perfil profissional');
      }
      
      if (checkError && checkError.code !== 'PGRST116') {
        return handleSupabaseError(checkError);
      }
      
      // Inserir o perfil
      const { data: newProfile, error } = await supabase
        .from('profissionais')
        .insert([data])
        .select();
      
      if (error) {
        console.error('Erro ao criar perfil profissional:', error);
        return handleSupabaseError(error);
      }
      
      return newProfile[0];
    } catch (error) {
      console.error('Erro ao criar perfil profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao criar perfil profissional');
    }
  }

  /**
   * Atualiza um perfil profissional existente
   * @param id ID do perfil
   * @param data Dados para atualização
   * @returns Perfil atualizado
   */
  async update(id: string, data: any) {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profissionais')
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Erro ao atualizar perfil profissional:', error);
        return handleSupabaseError(error);
      }
      
      return updatedProfile[0];
    } catch (error) {
      console.error(`Erro ao atualizar perfil profissional: ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao atualizar perfil profissional');
    }
  }

  /**
   * Exclui um perfil profissional
   * @param id ID do perfil
   * @returns Mensagem de sucesso
   */
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir perfil profissional:', error);
        return handleSupabaseError(error);
      }
      
      return { message: 'Perfil profissional excluído com sucesso' };
    } catch (error) {
      console.error(`Erro ao excluir perfil profissional: ${id}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Erro ao excluir perfil profissional');
    }
  }
}

export default new ProfissionalRepository(); 