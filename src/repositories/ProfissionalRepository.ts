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
      console.log('[REPO_UPDATE] =================================');
      console.log('[REPO_UPDATE] Iniciando atualização no repositório');
      console.log('[REPO_UPDATE] ID do perfil:', id);
      console.log('[REPO_UPDATE] Dados para atualização:', JSON.stringify(data, null, 2));
      
      // Verificar se o perfil existe antes de tentar atualizar
      const { data: existingProfile, error: checkError } = await supabase
        .from('profissionais')
        .select('id, user_id, nome, email')
        .eq('id', id)
        .single();
      
      if (checkError) {
        console.error('[REPO_UPDATE] Erro ao verificar perfil existente:', checkError);
        if (checkError.code === 'PGRST116') {
          throw new AppError(404, 'Perfil profissional não encontrado');
        }
        return handleSupabaseError(checkError);
      }
      
      console.log('[REPO_UPDATE] Perfil existente encontrado:', existingProfile);
      
      // Definir campos válidos da tabela profissionais
      const camposValidos = [
        'nome', 'ocupacao', 'especialidades', 'experiencia', 'educacao', 
        'certificacoes', 'portfolio', 'disponibilidade', 'valor_hora', 
        'sobre', 'foto', 'telefone', 'email', 'website', 'endereco', 
        'cidade', 'estado', 'social_media', 'status', 'featured', 'updated_at'
      ];
      
      // Filtrar apenas campos válidos e remover undefined
      const cleanData = Object.fromEntries(
        Object.entries(data)
          .filter(([key, value]) => {
            // Verificar se o campo é válido
            if (!camposValidos.includes(key)) {
              console.log(`[REPO_UPDATE] Campo '${key}' ignorado (não existe na tabela)`);
              return false;
            }
            // Manter null explícito, mas remover undefined
            return value !== undefined;
          })
      );
      
      console.log('[REPO_UPDATE] Dados filtrados e limpos:', JSON.stringify(cleanData, null, 2));
      
      // Verificar se há dados para atualizar
      if (Object.keys(cleanData).length === 0) {
        console.log('[REPO_UPDATE] Nenhum campo válido para atualizar');
        throw new AppError(400, 'Nenhum campo válido fornecido para atualização');
      }
      
      // Atualizar o perfil
      const { data: updatedProfile, error } = await supabase
        .from('profissionais')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('[REPO_UPDATE] Erro na atualização:', error);
        console.error('[REPO_UPDATE] Código do erro:', error.code);
        console.error('[REPO_UPDATE] Mensagem do erro:', error.message);
        console.error('[REPO_UPDATE] Detalhes do erro:', error.details);
        console.error('[REPO_UPDATE] Hint do erro:', error.hint);
        
        // Tratar erros específicos
        if (error.code === '23505') {
          throw new AppError(400, 'Dados duplicados - verifique email ou telefone');
        }
        
        if (error.code === '23502') {
          throw new AppError(400, 'Campo obrigatório ausente');
        }
        
        if (error.code === '22001') {
          throw new AppError(400, 'Dados muito longos para o campo');
        }
        
        return handleSupabaseError(error);
      }
      
      if (!updatedProfile) {
        console.error('[REPO_UPDATE] Atualização retornou dados vazios');
        throw new AppError(404, 'Perfil não encontrado após atualização');
      }
      
      console.log('[REPO_UPDATE] Perfil atualizado com sucesso:', updatedProfile);
      console.log('[REPO_UPDATE] =================================');
      
      return updatedProfile;
    } catch (error: any) {
      console.error('[REPO_UPDATE] =================================');
      console.error(`[REPO_UPDATE] ERRO ao atualizar perfil profissional: ${id}`, error);
      console.error('[REPO_UPDATE] Tipo do erro:', typeof error);
      console.error('[REPO_UPDATE] Nome do erro:', error?.name);
      console.error('[REPO_UPDATE] Mensagem do erro:', error?.message);
      console.error('[REPO_UPDATE] Stack do erro:', error?.stack);
      console.error('[REPO_UPDATE] =================================');
      
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Erro ao atualizar perfil profissional: ${error?.message || 'Erro desconhecido'}`);
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