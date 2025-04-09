import { supabase, handleSupabaseError } from '../lib/supabase';
import slugify from 'slugify';
import { AppError } from '../middlewares/errorHandler';
import { Empresa, EmpresaParams, PaginatedEmpresaResponse, SingleEmpresaResponse } from '../types/empresa';
import { Database } from '../types/supabase';

type EmpresaRow = Database['public']['Tables']['empresas']['Row'];
type EmpresaInsert = Database['public']['Tables']['empresas']['Insert'];
type EmpresaUpdate = Database['public']['Tables']['empresas']['Update'];

/**
 * Serviço para operações de empresas usando Supabase
 */
export class EmpresaSupabaseService {
  /**
   * Retorna uma lista paginada de empresas com filtros
   * @param params Parâmetros de filtro e paginação
   */
  async getEmpresas(params: EmpresaParams): Promise<PaginatedEmpresaResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        state,
        city,
        search,
        featured,
        sortBy = 'created_at',
        order = 'desc',
        status
      } = params;

      console.log('Buscando empresas com parâmetros:', JSON.stringify(params));

      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construir a query base
      let query = supabase
        .from('empresas')
        .select('*', { count: 'exact' });
      
      // Aplicar filtros
      if (category) {
        query = query.eq('category', category);
      }
      
      if (state) {
        query = query.eq('state', state);
      }
      
      if (city) {
        query = query.eq('city', city);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }
      
      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }
      
      // Filtrar por status
      if (status) {
        query = query.eq('status', status);
      } else {
        // Por padrão, mostrar apenas empresas aprovadas em consultas públicas
        query = query.eq('status', 'aprovado');
      }
      
      console.log('SQL gerado (aproximado):', `SELECT * FROM empresas WHERE ... ORDER BY ${sortBy} ${order} LIMIT ${limit} OFFSET ${from}`);
      
      // Aplicar ordenação e paginação
      const { data, count, error } = await query
        .order(sortBy, { ascending: order === 'asc' })
        .range(from, to);
      
      // Log dos resultados
      console.log(`Resultados encontrados: ${count || 0}, Página: ${page}, Limite: ${limit}`);
      if (data && data.length > 0) {
        console.log('Primeiro resultado:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('Nenhum resultado encontrado. Verificando se a tabela tem dados...');
        
        // Verificar se a tabela tem dados
        const { count: totalCount, error: countError } = await supabase
          .from('empresas')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Erro ao verificar total de registros:', countError);
        } else {
          console.log(`Total de registros na tabela: ${totalCount || 0}`);
        }
      }
      
      if (error) {
        console.error('Erro ao buscar empresas:', error);
        throw new AppError(500, error.message);
      }
      
      // Mapear os resultados para o formato esperado
      const empresas = data.map(empresa => this.mapEmpresaRowToEmpresa(empresa));
      
      return {
        data: empresas,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar empresas:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna os detalhes de uma empresa específica
   * @param id ID da empresa
   */
  async getEmpresaById(id: number): Promise<SingleEmpresaResponse> {
    try {
      console.log(`Buscando empresa com ID: ${id}`);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Erro na consulta do Supabase: ${error.message}`);
        
        if (error.code === 'PGRST116') {
          throw new AppError(404, 'Empresa não encontrada');
        }
        throw new AppError(500, error.message);
      }
      
      if (!data) {
        throw new AppError(404, 'Empresa não encontrada');
      }
      
      return { data: this.mapEmpresaRowToEmpresa(data) };
    } catch (error: any) {
      console.error(`Erro ao buscar empresa por ID: ${error.message}`);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Cria uma nova empresa
   * @param data Dados da empresa
   */
  async createEmpresa(data: Omit<Empresa, 'id' | 'created_at' | 'updated_at' | 'slug'>): Promise<SingleEmpresaResponse> {
    try {
      // Validar dados obrigatórios
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      if (!data.category || typeof data.category !== 'string') {
        throw new AppError(400, 'Categoria é obrigatória e deve ser uma string');
      }
      
      if (!data.state || typeof data.state !== 'string') {
        throw new AppError(400, 'Estado é obrigatório e deve ser uma string');
      }
      
      if (!data.city || typeof data.city !== 'string') {
        throw new AppError(400, 'Cidade é obrigatória e deve ser uma string');
      }
      
      // Não gerar mais o slug, já que a coluna não existe na tabela
      // const slug = slugify(data.name, { lower: true, strict: true });
      
      // Preparar dados para inserção (sem o campo slug)
      const empresaData: EmpresaInsert = {
        name: data.name,
        // slug, // Remover esta linha
        category: data.category,
        description: data.description || null,
        image: data.image || null,
        address: data.address || null,
        phone: data.phone || null,
        state: data.state,
        city: data.city,
        email: data.email || null,
        website: data.website || null,
        social_media: data.social_media || null,
        opening_hours: data.opening_hours || null,
        is_featured: data.is_featured || false,
        rating: data.rating || null,
        status: data.status || 'pendente'
        // created_at e updated_at são definidos pelo banco de dados com valor padrão
      };
      
      // Inserir no banco
      const { data: newEmpresa, error } = await supabase
        .from('empresas')
        .insert(empresaData)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar empresa:', error);
        throw new AppError(500, `Erro ao criar empresa: ${error.message}`);
      }
      
      return { 
        data: this.mapEmpresaRowToEmpresa(newEmpresa),
        message: 'Empresa criada com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Atualiza uma empresa existente
   * @param id ID da empresa
   * @param data Dados para atualização
   */
  async updateEmpresa(id: number, data: Partial<Empresa>): Promise<SingleEmpresaResponse> {
    try {
      // Verificar se a empresa existe
      const { data: existingEmpresa, error: findError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Empresa não encontrada');
        }
        throw new AppError(500, findError.message);
      }
      
      // Verificar se está tentando mudar o nome/slug
      if (data.name && data.name !== existingEmpresa.name) {
        // Não precisamos mais gerar um slug, já que a coluna não existe
        // const slug = slugify(data.name, { lower: true, strict: true });
        
        // Não adicionar mais o slug aos dados
        // data.slug = slug;
      }
      
      // Preparar dados para atualização
      const updateData: EmpresaUpdate = {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.state && { state: data.state }),
        ...(data.city && { city: data.city }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.social_media !== undefined && { social_media: data.social_media }),
        ...(data.opening_hours !== undefined && { opening_hours: data.opening_hours }),
        ...(data.is_featured !== undefined && { is_featured: data.is_featured }),
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.status && { status: data.status }),
        updated_at: new Date().toISOString()
      };
      
      // Atualizar no banco
      const { data: updatedEmpresa, error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(500, `Erro ao atualizar empresa: ${error.message}`);
      }
      
      return { 
        data: this.mapEmpresaRowToEmpresa(updatedEmpresa),
        message: 'Empresa atualizada com sucesso'
      };
    } catch (error: any) {
      console.error('Erro ao atualizar empresa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Exclui uma empresa
   * @param id ID da empresa
   */
  async deleteEmpresa(id: number): Promise<{ message: string }> {
    try {
      // Verificar se a empresa existe
      const { data: existingEmpresa, error: findError } = await supabase
        .from('empresas')
        .select('id')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Empresa não encontrada');
        }
        throw new AppError(500, findError.message);
      }
      
      // Excluir do banco
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new AppError(500, `Erro ao excluir empresa: ${error.message}`);
      }
      
      return { message: 'Empresa excluída com sucesso' };
    } catch (error: any) {
      console.error('Erro ao excluir empresa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Busca empresas por termo e filtros opcionais
   * @param query Termo de busca
   * @param category Categoria opcional
   * @param state Estado opcional
   * @param city Cidade opcional
   */
  async searchEmpresas(
    query: string,
    category?: string,
    state?: string,
    city?: string,
    limit = 10,
    page = 1
  ): Promise<PaginatedEmpresaResponse> {
    try {
      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construir a query base
      let dbQuery = supabase
        .from('empresas')
        .select('*', { count: 'exact' });
      
      // Aplicar filtro de busca apenas se houver um termo
      if (query && query.trim() !== '') {
        dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }
      
      // Aplicar filtros adicionais
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }
      
      if (state) {
        dbQuery = dbQuery.eq('state', state);
      }
      
      if (city) {
        dbQuery = dbQuery.eq('city', city);
      }
      
      // Aplicar paginação
      const { data, count, error } = await dbQuery
        .order('name')
        .range(from, to);
      
      if (error) throw new AppError(500, error.message);
      
      // Mapear os resultados
      const empresas = data.map(empresa => this.mapEmpresaRowToEmpresa(empresa));
      
      return {
        data: empresas,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar empresas por termo:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna empresas em destaque
   * @param limit Quantidade de itens
   */
  async getEmpresasEmDestaque(limit = 10): Promise<{ data: Empresa[] }> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('is_featured', true)
        .eq('status', 'active')
        .order('name')
        .limit(limit);
      
      if (error) throw new AppError(500, error.message);
      
      const empresas = data.map(empresa => this.mapEmpresaRowToEmpresa(empresa));
      
      return { data: empresas };
    } catch (error: any) {
      console.error('Falha ao buscar empresas em destaque:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna empresas de uma determinada categoria
   * @param category Categoria
   * @param limit Quantidade de itens por página
   * @param page Número da página
   */
  async getEmpresasByCategory(
    category: string,
    limit = 10,
    page = 1
  ): Promise<PaginatedEmpresaResponse> {
    try {
      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, count, error } = await supabase
        .from('empresas')
        .select('*', { count: 'exact' })
        .eq('category', category)
        .eq('status', 'active')
        .order('name')
        .range(from, to);
      
      if (error) throw new AppError(500, error.message);
      
      const empresas = data.map(empresa => this.mapEmpresaRowToEmpresa(empresa));
      
      return {
        data: empresas,
        meta: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar empresas por categoria:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Retorna as categorias disponíveis
   */
  async getCategorias(): Promise<{ data: string[] }> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('category')
        .eq('status', 'active');
      
      if (error) throw new AppError(500, error.message);
      
      // Extrair categorias únicas
      const categorias = [...new Set(data.map(item => item.category))].sort();
      
      return { data: categorias };
    } catch (error: any) {
      console.error('Falha ao buscar categorias de empresas:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Atualiza o status de uma empresa e opcionalmente o motivo da rejeição
   * @param id ID da empresa
   * @param status Novo status ('aprovado', 'rejeitado', 'pendente')
   * @param rejectionReason Motivo da rejeição (opcional, apenas para status 'rejeitado')
   */
  async updateEmpresaStatus(
    id: number, 
    status: 'aprovado' | 'rejeitado' | 'pendente',
    rejectionReason?: string
  ): Promise<SingleEmpresaResponse> {
    try {
      // Verificar se a empresa existe
      const { data: existingEmpresa, error: findError } = await supabase
        .from('empresas')
        .select('id')
        .eq('id', id)
        .single();
      
      if (findError) {
        if (findError.code === 'PGRST116') {
          throw new AppError(404, 'Empresa não encontrada');
        }
        throw new AppError(500, findError.message);
      }
      
      if (!existingEmpresa) {
        throw new AppError(404, 'Empresa não encontrada');
      }
      
      // Dados para atualização
      const updateData: {
        status: 'aprovado' | 'rejeitado' | 'pendente',
        rejectionReason?: string | null,
        updated_at: string
      } = {
        status,
        updated_at: new Date().toISOString()
      };
      
      // Adicionar motivo de rejeição apenas se o status for 'rejeitado'
      if (status === 'rejeitado') {
        updateData.rejectionReason = rejectionReason || null;
      } else {
        // Limpar o motivo de rejeição para outros status
        updateData.rejectionReason = null;
      }
      
      // Atualizar o status e potencialmente o motivo de rejeição
      const { data: updatedEmpresa, error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new AppError(500, `Erro ao atualizar status da empresa: ${error.message}`);
      }
      
      let message;
      switch (status) {
        case 'aprovado':
          message = 'Empresa aprovada com sucesso';
          break;
        case 'rejeitado':
          message = 'Empresa rejeitada com sucesso';
          break;
        default:
          message = 'Status da empresa atualizado com sucesso';
      }
      
      return { 
        data: this.mapEmpresaRowToEmpresa(updatedEmpresa),
        message
      };
    } catch (error: any) {
      console.error('Erro ao atualizar status da empresa:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  /**
   * Converte o objeto da tabela para o tipo Empresa
   * @private
   */
  private mapEmpresaRowToEmpresa(data: EmpresaRow): Empresa {
    // Mapear o status antigo para o novo formato
    let status: 'aprovado' | 'rejeitado' | 'pendente';
    
    switch (data.status) {
      case 'active':
        status = 'aprovado';
        break;
      case 'inactive':
        status = 'rejeitado';
        break;
      case 'pending':
        status = 'pendente';
        break;
      // Caso já esteja nos novos formatos
      case 'aprovado':
        status = 'aprovado';
        break;
      case 'rejeitado':
        status = 'rejeitado';
        break;
      case 'pendente':
        status = 'pendente';
        break;
      default:
        status = 'pendente';
    }
    
    return {
      id: data.id,
      name: data.name,
      slug: data.slug || undefined,
      category: data.category,
      description: data.description,
      image: data.image,
      address: data.address,
      phone: data.phone,
      state: data.state,
      city: data.city,
      email: data.email,
      website: data.website,
      social_media: data.social_media as Empresa['social_media'],
      opening_hours: data.opening_hours as Empresa['opening_hours'],
      is_featured: data.is_featured,
      rating: data.rating,
      status,
      rejectionReason: null, // O campo pode não existir na tabela ainda
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
} 