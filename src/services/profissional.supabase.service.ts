import { supabase, handleSupabaseError } from '../lib/supabase';
import slugify from 'slugify';
import { AppError } from '../middlewares/errorHandler';
import { Profissional, ProfissionalParams, PaginatedProfissionalResponse, SingleProfissionalResponse } from '../types/profissional';
import { Database } from '../types/supabase';

type ProfissionalRow = Database['public']['Tables']['profissionais']['Row'];
type ProfissionalInsert = Database['public']['Tables']['profissionais']['Insert'];
type ProfissionalUpdate = Database['public']['Tables']['profissionais']['Update'];

/**
 * Serviço para operações de profissionais usando Supabase
 */
export class ProfissionalSupabaseService {
  /**
   * Retorna uma lista paginada de profissionais com filtros
   * @param params Parâmetros de filtro e paginação
   */
  async getProfissionais(params: ProfissionalParams): Promise<PaginatedProfissionalResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        ocupacao,
        estado,
        cidade,
        search,
        featured,
        sortBy = 'created_at',
        order = 'desc',
        status = 'APPROVED'
      } = params;

      console.log('Buscando profissionais com parâmetros:', JSON.stringify(params));

      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construir a query base
      let query = supabase
        .from('profissionais')
        .select('*', { count: 'exact' });
      
      // Por padrão, mostra apenas profissionais aprovados
      if (status !== 'ALL') {
        query = query.eq('status', status);
      }
      
      // Aplicar filtros
      if (ocupacao) {
        query = query.eq('ocupacao', ocupacao);
      }
      
      if (estado) {
        query = query.eq('estado', estado);
      }
      
      if (cidade) {
        query = query.eq('cidade', cidade);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,descricao.ilike.%${search}%,ocupacao.ilike.%${search}%`);
      }
      
      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }
      
      console.log('SQL gerado (aproximado):', `SELECT * FROM profissionais WHERE ... ORDER BY ${sortBy} ${order} LIMIT ${limit} OFFSET ${from}`);
      
      // Aplicar ordenação e paginação
      const { data, count, error } = await query
        .order(sortBy, { ascending: order === 'asc' })
        .range(from, to);
      
      // Log dos resultados
      console.log(`Resultados encontrados: ${count || 0}, Página: ${page}, Limite: ${limit}`);
      
      if (error) {
        console.error('Erro ao buscar profissionais:', error);
        throw new AppError(500, error.message);
      }
      
      // Mapear os resultados para o formato esperado
      const profissionais = data.map(profissional => this.mapProfissionalRowToProfissional(profissional));
      
      return {
        data: profissionais,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar profissionais:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna os detalhes de um profissional específico
   * @param id ID do profissional
   */
  async getProfissionalById(id: number): Promise<SingleProfissionalResponse> {
    try {
      console.log(`Buscando profissional com ID: ${id}`);
      
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', id)
        .eq('status', 'APPROVED')
        .single();
      
      if (error) {
        console.error(`Erro na consulta do Supabase: ${error.message}`);
        
        if (error.code === 'PGRST116') {
          throw new AppError(404, 'Profissional não encontrado');
        }
        throw new AppError(500, error.message);
      }
      
      if (!data) {
        throw new AppError(404, 'Profissional não encontrado');
      }
      
      return { data: this.mapProfissionalRowToProfissional(data) };
    } catch (error: any) {
      console.error(`Erro ao buscar profissional por ID: ${error.message}`);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna o profissional pelo ID do usuário
   * @param userId ID do usuário
   */
  async getProfissionalByUserId(userId: string): Promise<SingleProfissionalResponse> {
    try {
      console.log(`Buscando profissional do usuário: ${userId}`);
      
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError(404, 'Perfil de profissional não encontrado');
        }
        throw new AppError(500, error.message);
      }
      
      return { data: this.mapProfissionalRowToProfissional(data) };
    } catch (error: any) {
      console.error(`Erro ao buscar profissional por user_id: ${error.message}`);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Cria um novo profissional
   * @param data Dados do profissional
   * @param userId ID do usuário autenticado
   */
  async createProfissional(
    data: Omit<Profissional, 'id' | 'created_at' | 'updated_at' | 'slug'>, 
    userId: string
  ): Promise<SingleProfissionalResponse> {
    try {
      // Validar dados obrigatórios
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      if (!data.ocupacao || typeof data.ocupacao !== 'string') {
        throw new AppError(400, 'Ocupação é obrigatória e deve ser uma string');
      }
      
      if (!data.estado || typeof data.estado !== 'string') {
        throw new AppError(400, 'Estado é obrigatório e deve ser uma string');
      }
      
      if (!data.cidade || typeof data.cidade !== 'string') {
        throw new AppError(400, 'Cidade é obrigatória e deve ser uma string');
      }
      
      // Verificar se o usuário já tem um perfil de profissional
      const { data: existingProfile, error: checkError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        throw new AppError(500, `Erro ao verificar perfil existente: ${checkError.message}`);
      }
      
      if (existingProfile) {
        throw new AppError(409, 'Usuário já possui um perfil de profissional');
      }
      
      // Gerar slug
      const slug = slugify(data.name, { lower: true, strict: true });
      
      // Preparar dados para inserção
      const profissionalData: ProfissionalInsert = {
        name: data.name,
        slug,
        ocupacao: data.ocupacao,
        descricao: data.descricao || null,
        foto: data.foto || null,
        endereco: data.endereco || null,
        telefone: data.telefone || null,
        estado: data.estado,
        cidade: data.cidade,
        email: data.email || null,
        website: data.website || null,
        redes_sociais: data.redes_sociais || null,
        disponibilidade: data.disponibilidade || null,
        is_featured: data.is_featured || false,
        avaliacao: data.avaliacao || null,
        status: 'PENDING', // Novos profissionais começam com status pendente
        user_id: userId,
        // created_at e updated_at são definidos pelo banco de dados com valor padrão
      };
      
      // Inserir no banco
      const { data: newProfissional, error } = await supabase
        .from('profissionais')
        .insert(profissionalData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar profissional:', error);
        throw new AppError(500, `Erro ao criar profissional: ${error.message}`);
      }
      
      return { 
        data: this.mapProfissionalRowToProfissional(newProfissional),
        message: 'Perfil de profissional criado com sucesso. Aguardando aprovação.'
      };
    } catch (error: any) {
      console.error('Erro ao criar profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Atualiza um profissional existente
   * @param id ID do profissional
   * @param data Dados para atualização
   * @param userId ID do usuário (para verificação de propriedade)
   * @param isAdmin Flag que indica se o usuário é administrador
   */
  async updateProfissional(
    id: number, 
    data: Partial<Profissional>, 
    userId?: string,
    isAdmin = false
  ): Promise<SingleProfissionalResponse> {
    try {
      // Verificar se o profissional existe
      const { data: existingProfissional, error: findError } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Profissional não encontrado');
        }
        throw new AppError(500, findError.message);
      }
      
      // Se não for admin, verificar se o usuário é dono do perfil
      if (!isAdmin && userId && existingProfissional.user_id !== userId) {
        throw new AppError(403, 'Você não tem permissão para atualizar este perfil');
      }
      
      // Verificar se está tentando mudar o nome/slug
      if (data.name && data.name !== existingProfissional.name) {
        const slug = slugify(data.name, { lower: true, strict: true });
        data.slug = slug;
      }
      
      // Se for atualização do usuário comum (não admin) e estiver tentando mudar status ou featured
      if (!isAdmin) {
        // Não permitir que usuários comuns alterem esses campos
        delete data.status;
        delete data.is_featured;
        
        // Atualização pelo usuário redefine o status para pendente
        data.status = 'PENDING';
      }
      
      // Preparar dados para atualização
      const updateData: ProfissionalUpdate = {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.ocupacao && { ocupacao: data.ocupacao }),
        ...(data.descricao !== undefined && { descricao: data.descricao }),
        ...(data.foto !== undefined && { foto: data.foto }),
        ...(data.endereco !== undefined && { endereco: data.endereco }),
        ...(data.telefone !== undefined && { telefone: data.telefone }),
        ...(data.estado && { estado: data.estado }),
        ...(data.cidade && { cidade: data.cidade }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.redes_sociais !== undefined && { redes_sociais: data.redes_sociais }),
        ...(data.disponibilidade !== undefined && { disponibilidade: data.disponibilidade }),
        ...(isAdmin && data.is_featured !== undefined && { is_featured: data.is_featured }),
        ...(data.avaliacao !== undefined && { avaliacao: data.avaliacao }),
        ...(isAdmin && data.status && { status: data.status }),
        updated_at: new Date().toISOString()
      };
      
      // Atualizar no banco
      const { data: updatedProfissional, error } = await supabase
        .from('profissionais')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(500, `Erro ao atualizar profissional: ${error.message}`);
      }
      
      return { 
        data: this.mapProfissionalRowToProfissional(updatedProfissional),
        message: isAdmin ? 'Profissional atualizado com sucesso' : 'Perfil atualizado com sucesso. Aguardando aprovação das alterações.'
      };
    } catch (error: any) {
      console.error('Erro ao atualizar profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Atualiza apenas o status de um profissional (para uso administrativo)
   * @param id ID do profissional
   * @param status Novo status
   */
  async updateProfissionalStatus(id: number, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<SingleProfissionalResponse> {
    try {
      // Verificar se o profissional existe
      const { data: existingProfissional, error: findError } = await supabase
        .from('profissionais')
        .select('id')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Profissional não encontrado');
        }
        throw new AppError(500, findError.message);
      }
      
      // Atualizar apenas o status
      const { data: updatedProfissional, error } = await supabase
        .from('profissionais')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(500, `Erro ao atualizar status do profissional: ${error.message}`);
      }
      
      let message;
      switch (status) {
        case 'APPROVED':
          message = 'Profissional aprovado com sucesso';
          break;
        case 'REJECTED':
          message = 'Profissional rejeitado com sucesso';
          break;
        default:
          message = 'Status do profissional atualizado com sucesso';
      }
      
      return { 
        data: this.mapProfissionalRowToProfissional(updatedProfissional),
        message
      };
    } catch (error: any) {
      console.error('Erro ao atualizar status do profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Atualiza destaque do profissional (para uso administrativo)
   * @param id ID do profissional
   * @param featured Status de destaque
   */
  async updateProfissionalFeatured(id: number, featured: boolean): Promise<SingleProfissionalResponse> {
    try {
      // Verificar se o profissional existe
      const { data: existingProfissional, error: findError } = await supabase
        .from('profissionais')
        .select('id, status')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Profissional não encontrado');
        }
        throw new AppError(500, findError.message);
      }
      
      // Apenas profissionais aprovados podem ser destacados
      if (featured && existingProfissional.status !== 'APPROVED') {
        throw new AppError(400, 'Apenas profissionais aprovados podem ser destacados');
      }
      
      // Atualizar status de destaque
      const { data: updatedProfissional, error } = await supabase
        .from('profissionais')
        .update({ 
          is_featured: featured, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(500, `Erro ao atualizar destaque do profissional: ${error.message}`);
      }
      
      return { 
        data: this.mapProfissionalRowToProfissional(updatedProfissional),
        message: featured ? 'Profissional destacado com sucesso' : 'Destaque removido com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao atualizar destaque do profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Exclui um profissional
   * @param id ID do profissional
   * @param userId ID do usuário (para verificação de propriedade)
   * @param isAdmin Flag que indica se o usuário é administrador
   */
  async deleteProfissional(id: number, userId?: string, isAdmin = false): Promise<{ message: string }> {
    try {
      // Verificar se o profissional existe
      const { data: existingProfissional, error: findError } = await supabase
        .from('profissionais')
        .select('id, user_id')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Profissional não encontrado');
        }
        throw new AppError(500, findError.message);
      }
      
      // Se não for admin, verificar se o usuário é dono do perfil
      if (!isAdmin && userId && existingProfissional.user_id !== userId) {
        throw new AppError(403, 'Você não tem permissão para excluir este perfil');
      }
      
      // Excluir do banco
      const { error } = await supabase
        .from('profissionais')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new AppError(500, `Erro ao excluir profissional: ${error.message}`);
      }
      
      return { message: 'Profissional excluído com sucesso' };
    } catch (error: any) {
      console.error('Erro ao excluir profissional:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Busca profissionais por termo e filtros opcionais
   * @param query Termo de busca
   * @param ocupacao Ocupação opcional
   * @param estado Estado opcional
   * @param cidade Cidade opcional
   */
  async searchProfissionais(
    query: string,
    ocupacao?: string,
    estado?: string,
    cidade?: string,
    limit = 10,
    page = 1
  ): Promise<PaginatedProfissionalResponse> {
    try {
      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construir a query base
      let dbQuery = supabase
        .from('profissionais')
        .select('*', { count: 'exact' })
        .eq('status', 'APPROVED');
      
      // Aplicar filtro de busca apenas se houver um termo
      if (query && query.trim() !== '') {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,descricao.ilike.%${query}%,ocupacao.ilike.%${query}%`);
      }
      
      // Aplicar filtros adicionais
      if (ocupacao) {
        dbQuery = dbQuery.eq('ocupacao', ocupacao);
      }
      
      if (estado) {
        dbQuery = dbQuery.eq('estado', estado);
      }
      
      if (cidade) {
        dbQuery = dbQuery.eq('cidade', cidade);
      }
      
      // Aplicar paginação
      const { data, count, error } = await dbQuery
        .order('name')
        .range(from, to);
      
      if (error) throw new AppError(500, error.message);
      
      // Mapear os resultados
      const profissionais = data.map(profissional => this.mapProfissionalRowToProfissional(profissional));
      
      return {
        data: profissionais,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar profissionais por termo:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna profissionais em destaque
   * @param limit Quantidade de itens
   */
  async getProfissionaisEmDestaque(limit = 10): Promise<{ data: Profissional[] }> {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw new AppError(500, error.message);
      
      const profissionais = data.map(profissional => this.mapProfissionalRowToProfissional(profissional));
      
      return { data: profissionais };
    } catch (error: any) {
      console.error('Falha ao buscar profissionais em destaque:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna ocupações disponíveis
   */
  async getOcupacoes(): Promise<{ data: string[] }> {
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('ocupacao')
        .eq('status', 'APPROVED');
      
      if (error) throw new AppError(500, error.message);
      
      // Extrair ocupações únicas
      const ocupacoes = [...new Set(data.map(item => item.ocupacao))].sort();
      
      return { data: ocupacoes };
    } catch (error: any) {
      console.error('Falha ao buscar ocupações de profissionais:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Converte o objeto da tabela para o tipo Profissional
   * @private
   */
  private mapProfissionalRowToProfissional(data: ProfissionalRow): Profissional {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug || undefined,
      ocupacao: data.ocupacao,
      descricao: data.descricao,
      foto: data.foto,
      endereco: data.endereco,
      telefone: data.telefone,
      estado: data.estado,
      cidade: data.cidade,
      email: data.email,
      website: data.website,
      redes_sociais: data.redes_sociais as Profissional['redes_sociais'],
      disponibilidade: data.disponibilidade as Profissional['disponibilidade'],
      is_featured: data.is_featured,
      avaliacao: data.avaliacao,
      status: data.status as 'APPROVED' | 'REJECTED' | 'PENDING',
      user_id: data.user_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
} 