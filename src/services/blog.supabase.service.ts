import slugify from 'slugify';
import supabase from '../config/supabase';
import { AppError } from '../middlewares/errorHandler';
import { PaginationParams, Post, Category, Tag } from '../types/blog';

export class BlogSupabaseService {
  // Posts
  async getPosts(params: PaginationParams) {
    console.log('Iniciando getPosts com params:', params);
    const {
      page = 1,
      limit = 10,
      published,
      featured,
      categoryId,
      authorId,
      search,
      tags,
      sortBy = 'createdAt',
      order = 'desc',
      validCategoryOnly = false
    } = params;

    // Início da consulta
    let query = supabase
      .from('BlogPost')
      .select('*');

    console.log('Query inicial construída');

    // Aplicar filtros
    if (published !== undefined) {
      query = query.eq('published', published);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured);
    }
    
    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    // Filtrar posts com categoryId nulo se validCategoryOnly for true
    if (validCategoryOnly === true) {
      query = query.not('categoryId', 'is', null);
    }
    
    if (authorId) {
      query = query.eq('authorId', authorId);
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }
    
    // Filtro de tags (agora são arrays diretamente)
    if (tags && tags.length > 0) {
      query = query.contains('tags', tags);
    }

    console.log('Filtros aplicados à query');

    // Contagem total para paginação
    const countQuery = supabase
      .from('BlogPost')
      .select('*', { count: 'exact', head: true });
      
    // Se validCategoryOnly for true, aplicar o mesmo filtro na contagem
    if (validCategoryOnly === true) {
      countQuery.not('categoryId', 'is', null);
    }
    
    console.log('Executando query de contagem...');
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Erro na query de contagem:', countError);
      throw new AppError(500, `Erro na contagem: ${countError.message}`);
    }

    console.log('Total de posts encontrados:', count);

    // Paginação
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    console.log('Executando query principal...');
    // Ordenação e limite
    const { data, error } = await query
      .order(sortBy, { ascending: order === 'asc' })
      .range(from, to);

    if (error) {
      console.error('Erro na query principal:', error);
      throw new AppError(500, `Erro na consulta: ${error.message} (Código: ${error.code})`);
    }

    console.log(`Query executada com sucesso. Retornando ${data?.length || 0} posts`);

    return {
      data: data || [],
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    };
  }

  async getPostById(id: string, options: { validCategoryOnly?: boolean } = {}) {
    const { validCategoryOnly = false } = options;
    
    let query = supabase
      .from('BlogPost')
      .select('*')
      .eq('id', id);
    
    // Se validCategoryOnly for true, aplicar filtro
    if (validCategoryOnly === true) {
      query = query.not('categoryId', 'is', null);
    }
    
    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(404, 'Post não encontrado');
      }
      throw new AppError(500, error.message);
    }

    // Verificar se o post tem categoryId nulo (somente se validCategoryOnly for true)
    if (validCategoryOnly === true && (data.categoryId === null || data.categoryId === undefined)) {
      throw new AppError(400, 'Post com categoria inválida ou nula');
    }

    return { data };
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, options: { allowNullCategory?: boolean } = {}) {
    const { allowNullCategory = false } = options;
    
    // Validar dados obrigatórios
    if (!data.title || typeof data.title !== 'string') {
      throw new AppError(400, 'Título é obrigatório e deve ser uma string');
    }
    
    // Verificar se categoryId está presente quando necessário
    if (!allowNullCategory && (data.categoryId === null || data.categoryId === undefined)) {
      throw new AppError(400, 'ID da categoria é obrigatório');
    }
    
    // Se categoryId estiver definido, verificar se a categoria existe
    if (data.categoryId) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', data.categoryId)
        .single();
        
      if (categoryError || !category) {
        throw new AppError(400, 'Categoria não encontrada. ID fornecido: ' + data.categoryId);
      }
    }
    
    // Gerar slug automaticamente a partir do título
    const slug = slugify(data.title, { lower: true, strict: true });
    
    // Definir publishedAt se o post estiver sendo publicado
    const publishedAt = data.published ? new Date().toISOString() : null;
    
    try {
      const { data: post, error } = await supabase
        .from('BlogPost')
        .insert([{
          title: data.title,
          slug: slug,
          content: data.content || '',
          image: data.image || null,
          published: data.published || false,
          publishedAt: publishedAt,
          featured: data.featured || false,
          authorId: data.authorId || null,
          categoryId: data.categoryId || null,
          tags: data.tags || []
        }])
        .select('*')
        .single();

      if (error) {
        console.error('Erro ao criar post:', error);
        if (error.code === '23502') { // violação de not-null constraint
          throw new AppError(400, 'Campo obrigatório não fornecido: ' + error.message);
        }
        if (error.code === '23503') { // violação de foreign key
          throw new AppError(400, 'Referência inválida: ' + error.message);
        }
        throw new AppError(500, error.message);
      }

      return { data: post, message: 'Post criado com sucesso' };
    } catch (error: any) {
      console.error('Erro ao criar post:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Erro ao criar post');
    }
  }

  async updatePost(id: string, data: Partial<Post>) {
    // Se o título foi atualizado, gerar novo slug
    const slug = data.title ? slugify(data.title, { lower: true, strict: true }) : undefined;
    
    // Se o status de publicação mudou para true, atualizar publishedAt
    const updatePublishedAt = 
      data.published === true ? 
        { publishedAt: new Date().toISOString() } : 
        (data.published === false ? { publishedAt: null } : {});
    
    const { data: post, error } = await supabase
      .from('BlogPost')
      .update({
        ...(data.title && { title: data.title }),
        ...(slug && { slug }),
        ...(data.content && { content: data.content }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.published !== undefined && { published: data.published }),
        ...updatePublishedAt,
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.authorId && { authorId: data.authorId }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.tags && { tags: data.tags }),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new AppError(500, error.message);
    }

    return { data: post, message: 'Post atualizado com sucesso' };
  }

  async deletePost(id: string) {
    const { error } = await supabase
      .from('BlogPost')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, error.message);
    }

    return { message: 'Post deletado com sucesso' };
  }

  // Categories
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      throw new AppError(500, error.message);
    }

    return { data: data || [] };
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!data.name || typeof data.name !== 'string') {
      throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
    }
    
    const slug = slugify(data.name, { lower: true, strict: true });
    
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          slug,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria:', error);
        if (error.code === '23505') {
          throw new AppError(400, 'Já existe uma categoria com este nome');
        }
        throw new AppError(500, error.message);
      }

      return { data: category, message: 'Categoria criada com sucesso' };
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Erro ao criar categoria');
    }
  }

  async updateCategory(id: string, data: Partial<Category>) {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .update({
          ...(data.name && {
            name: data.name,
            slug: slugify(data.name, { lower: true, strict: true })
          }),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        if (error.code === '23505') {
          throw new AppError(400, 'Já existe uma categoria com este nome');
        }
        throw new AppError(500, error.message);
      }

      return { data: category, message: 'Categoria atualizada com sucesso' };
    } catch (error: any) {
      console.error('Erro ao atualizar categoria:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Erro ao atualizar categoria');
    }
  }

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, error.message);
    }

    return { message: 'Categoria deletada com sucesso' };
  }

  // Tags
  async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('*');

    if (error) {
      throw new AppError(500, error.message);
    }

    return { data: data || [] };
  }

  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!data.name || typeof data.name !== 'string') {
      throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
    }
    
    const slug = slugify(data.name, { lower: true, strict: true });
    
    try {
      const { data: tag, error } = await supabase
        .from('tags')
        .insert({
          name: data.name,
          slug,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar tag:', error);
        if (error.code === '23505') {
          throw new AppError(400, 'Já existe uma tag com este nome');
        }
        throw new AppError(500, error.message);
      }

      return { data: tag, message: 'Tag criada com sucesso' };
    } catch (error: any) {
      console.error('Erro ao criar tag:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Erro ao criar tag');
    }
  }

  async updateTag(id: string, data: Partial<Tag>) {
    try {
      const { data: tag, error } = await supabase
        .from('tags')
        .update({
          ...(data.name && {
            name: data.name,
            slug: slugify(data.name, { lower: true, strict: true })
          }),
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar tag:', error);
        if (error.code === '23505') {
          throw new AppError(400, 'Já existe uma tag com este nome');
        }
        throw new AppError(500, error.message);
      }

      return { data: tag, message: 'Tag atualizada com sucesso' };
    } catch (error: any) {
      console.error('Erro ao atualizar tag:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(500, 'Erro ao atualizar tag');
    }
  }

  async deleteTag(id: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) {
      throw new AppError(500, error.message);
    }

    return { message: 'Tag deletada com sucesso' };
  }
}

// Exportar uma instância singleton do serviço
export default new BlogSupabaseService(); 