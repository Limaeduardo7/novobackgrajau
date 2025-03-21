import { supabase, handleSupabaseError } from '../lib/supabase';
import slugify from 'slugify';
import { AppError } from '../middlewares/errorHandler';
import { PaginationParams, Post, Category, Tag, PaginatedResponse, SingleResponse } from '../types/blog';
import { Database } from '../types/supabase';

type BlogPost = Database['public']['Tables']['BlogPost']['Row'];
type BlogPostInsert = Database['public']['Tables']['BlogPost']['Insert'];
type BlogPostUpdate = Database['public']['Tables']['BlogPost']['Update'];

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

type TagRow = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];
type TagUpdate = Database['public']['Tables']['tags']['Update'];

/**
 * Serviço para operações do blog usando Supabase diretamente
 */
export class BlogSupabaseService {
  // Posts
  async getPosts(params: PaginationParams): Promise<PaginatedResponse<Post>> {
    try {
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
        order = 'desc'
      } = params;

      // Calcular o offset para paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Construir a query base
      let query = supabase
        .from('BlogPost')
        .select('*, category:categories(*)', { count: 'exact' });
      
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
      
      if (authorId) {
        query = query.eq('authorId', authorId);
      }
      
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }
      
      if (tags && tags.length > 0) {
        // Filtrar por posts que contêm todas as tags especificadas
        query = query.contains('tags', tags);
      }
      
      // Aplicar ordenação e paginação
      const { data, count, error } = await query
        .order(sortBy, { ascending: order === 'asc' })
        .range(from, to);
      
      if (error) throw new AppError(500, error.message);
      
      // Mapear os resultados para o formato esperado
      const posts = data.map(post => this.mapBlogPostToPost(post));
      
      return {
        data: posts,
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar posts do blog:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async getPostById(id: string, options: { validCategoryOnly?: boolean } = {}): Promise<SingleResponse<Post>> {
    try {
      const { validCategoryOnly = false } = options;
      
      let query = supabase
        .from('BlogPost')
        .select('*, category:categories(*)')
        .eq('id', id);
      
      if (validCategoryOnly) {
        query = query.not('categoryId', 'is', null);
      }
      
      const { data, error } = await query.single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          throw new AppError(404, 'Post não encontrado');
        }
        throw new AppError(500, error.message);
      }
      
      if (!data) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      return { data: this.mapBlogPostToPost(data) };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, options: { allowNullCategory?: boolean } = {}): Promise<SingleResponse<Post>> {
    try {
      const { allowNullCategory = false } = options;
      
      // Validar dados obrigatórios
      if (!data.title || typeof data.title !== 'string') {
        throw new AppError(400, 'Título é obrigatório e deve ser uma string');
      }
      
      // Verificar se categoryId está presente quando necessário
      if (!allowNullCategory && !data.categoryId) {
        throw new AppError(400, 'ID da categoria é obrigatório');
      }
      
      // Se categoryId estiver definido, verificar se a categoria existe
      if (data.categoryId) {
        const { data: category, error } = await supabase
          .from('categories')
          .select('id')
          .eq('id', data.categoryId)
          .single();
        
        if (error || !category) {
          throw new AppError(400, 'Categoria não encontrada');
        }
      }
      
      // Gerar slug
      const slug = slugify(data.title, { lower: true, strict: true });
      
      // Verificar se o slug já existe
      const { data: existingSlug } = await supabase
        .from('BlogPost')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (existingSlug) {
        throw new AppError(400, 'Já existe um post com este título/slug');
      }
      
      // Preparar dados para inserção
      const now = new Date().toISOString();
      const postData: BlogPostInsert = {
        title: data.title,
        slug,
        content: data.content || '',
        image: data.image,
        published: data.published || false,
        publishedAt: data.published ? now : null,
        featured: data.featured || false,
        authorId: data.authorId || null,
        categoryId: data.categoryId || null,
        tags: data.tags || [],
        createdAt: now,
        updatedAt: now
      };
      
      // Criar post
      const { data: newPost, error } = await supabase
        .from('BlogPost')
        .insert(postData)
        .select('*, category:categories(*)')
        .single();
      
      if (error) throw new AppError(500, error.message);
      
      return { 
        data: this.mapBlogPostToPost(newPost), 
        message: 'Post criado com sucesso' 
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async updatePost(id: string, data: Partial<Post>): Promise<SingleResponse<Post>> {
    try {
      // Verificar se o post existe
      const { data: existingPost, error: fetchError } = await supabase
        .from('BlogPost')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingPost) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      // Se categoryId estiver definido, verificar se a categoria existe
      if (data.categoryId) {
        const { data: category, error } = await supabase
          .from('categories')
          .select('id')
          .eq('id', data.categoryId)
          .single();
        
        if (error || !category) {
          throw new AppError(400, 'Categoria não encontrada');
        }
      }
      
      // Criar um objeto de atualização com tipos corretos para o Supabase
      const updateData: BlogPostUpdate = {};
      
      // Copiar apenas as propriedades que devem ser atualizadas
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.image !== undefined) updateData.image = data.image;
      if (data.published !== undefined) updateData.published = data.published;
      if (data.featured !== undefined) updateData.featured = data.featured;
      if (data.authorId !== undefined) updateData.authorId = data.authorId;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
      if (data.tags !== undefined) updateData.tags = data.tags;
      
      // Atualizar a data de modificação
      updateData.updatedAt = new Date().toISOString();
      
      // Se o título foi alterado, atualizar o slug
      if (data.title) {
        const slug = slugify(data.title, { lower: true, strict: true });
        
        // Verificar se o novo slug já existe em outro post
        const { data: existingSlug } = await supabase
          .from('BlogPost')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .single();
        
        if (existingSlug) {
          throw new AppError(400, 'Já existe outro post com este título/slug');
        }
        
        updateData.slug = slug;
      }
      
      // Se o status de publicação mudou para true, atualizar publishedAt
      if (data.published === true && !existingPost.publishedAt) {
        updateData.publishedAt = new Date().toISOString();
      } else if (data.published === false) {
        updateData.publishedAt = null;
      }
      
      // Atualizar post
      const { data: updatedPost, error: updateError } = await supabase
        .from('BlogPost')
        .update(updateData)
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();
      
      if (updateError) throw new AppError(500, updateError.message);
      
      return { 
        data: this.mapBlogPostToPost(updatedPost), 
        message: 'Post atualizado com sucesso' 
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async deletePost(id: string): Promise<{ message: string }> {
    try {
      // Verificar se o post existe
      const { data: existingPost, error: fetchError } = await supabase
        .from('BlogPost')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingPost) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      // Deletar post
      const { error } = await supabase
        .from('BlogPost')
        .delete()
        .eq('id', id);
      
      if (error) throw new AppError(500, error.message);
      
      return { message: 'Post deletado com sucesso' };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  // Categories
  async getCategories(): Promise<SingleResponse<Category[]>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw new AppError(500, error.message);
      
      return { 
        data: data.map(category => this.mapCategoryRowToCategory(category)) 
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleResponse<Category>> {
    try {
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      const slug = slugify(data.name, { lower: true, strict: true });
      
      // Verificar se o nome ou slug já existem
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .or(`name.eq.${data.name},slug.eq.${slug}`)
        .single();
      
      if (existing) {
        throw new AppError(400, 'Já existe uma categoria com este nome');
      }
      
      const now = new Date().toISOString();
      const categoryData: CategoryInsert = {
        name: data.name,
        slug,
        description: data.description || null,
        createdAt: now,
        updatedAt: now
      };
      
      const { data: newCategory, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select()
        .single();
      
      if (error) throw new AppError(500, error.message);
      
      return { 
        data: this.mapCategoryRowToCategory(newCategory),
        message: 'Categoria criada com sucesso' 
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<SingleResponse<Category>> {
    try {
      // Verificar se a categoria existe
      const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingCategory) {
        throw new AppError(404, 'Categoria não encontrada');
      }
      
      // Criar um objeto de atualização com tipos corretos para o Supabase
      const updateData: CategoryUpdate = {};
      
      // Copiar apenas as propriedades que devem ser atualizadas
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      
      // Atualizar a data de modificação
      updateData.updatedAt = new Date().toISOString();
      
      // Se o nome foi alterado, atualizar o slug
      if (data.name) {
        updateData.slug = slugify(data.name, { lower: true, strict: true });
        
        // Verificar se o novo nome ou slug já existem
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .or(`name.eq.${data.name},slug.eq.${updateData.slug}`)
          .neq('id', id)
          .single();
        
        if (existing) {
          throw new AppError(400, 'Já existe outra categoria com este nome');
        }
      }
      
      const { data: updatedCategory, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new AppError(500, error.message);
      
      return { 
        data: this.mapCategoryRowToCategory(updatedCategory),
        message: 'Categoria atualizada com sucesso' 
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    try {
      // Verificar se a categoria existe
      const { data: existingCategory, error: fetchError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingCategory) {
        throw new AppError(404, 'Categoria não encontrada');
      }
      
      // Verificar se existem posts usando esta categoria
      const { count, error: countError } = await supabase
        .from('BlogPost')
        .select('id', { count: 'exact', head: true })
        .eq('categoryId', id);
      
      if (countError) throw new AppError(500, countError.message);
      
      if (count && count > 0) {
        throw new AppError(400, `Não é possível excluir esta categoria pois ela está sendo usada por ${count} post(s)`);
      }
      
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) throw new AppError(500, error.message);
      
      return { message: 'Categoria deletada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  // Tags
  async getTags(): Promise<SingleResponse<Tag[]>> {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw new AppError(500, error.message);
      
      return {
        data: data.map(tag => this.mapTagRowToTag(tag))
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleResponse<Tag>> {
    try {
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      const slug = slugify(data.name, { lower: true, strict: true });
      
      // Verificar se o nome ou slug já existem
      const { data: existing } = await supabase
        .from('tags')
        .select('id')
        .or(`name.eq.${data.name},slug.eq.${slug}`)
        .single();
      
      if (existing) {
        throw new AppError(400, 'Já existe uma tag com este nome');
      }
      
      const now = new Date().toISOString();
      const tagData: TagInsert = {
        name: data.name,
        slug,
        description: data.description || null,
        createdAt: now,
        updatedAt: now
      };
      
      const { data: newTag, error } = await supabase
        .from('tags')
        .insert(tagData)
        .select()
        .single();
      
      if (error) throw new AppError(500, error.message);
      
      return {
        data: this.mapTagRowToTag(newTag),
        message: 'Tag criada com sucesso'
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async updateTag(id: string, data: Partial<Tag>): Promise<SingleResponse<Tag>> {
    try {
      // Verificar se a tag existe
      const { data: existingTag, error: fetchError } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingTag) {
        throw new AppError(404, 'Tag não encontrada');
      }
      
      // Criar um objeto de atualização com tipos corretos para o Supabase
      const updateData: TagUpdate = {};
      
      // Copiar apenas as propriedades que devem ser atualizadas
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      
      // Atualizar a data de modificação
      updateData.updatedAt = new Date().toISOString();
      
      // Se o nome foi alterado, atualizar o slug
      if (data.name) {
        updateData.slug = slugify(data.name, { lower: true, strict: true });
        
        // Verificar se o novo nome ou slug já existem
        const { data: existing } = await supabase
          .from('tags')
          .select('id')
          .or(`name.eq.${data.name},slug.eq.${updateData.slug}`)
          .neq('id', id)
          .single();
        
        if (existing) {
          throw new AppError(400, 'Já existe outra tag com este nome');
        }
      }
      
      const { data: updatedTag, error } = await supabase
        .from('tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new AppError(500, error.message);
      
      return {
        data: this.mapTagRowToTag(updatedTag),
        message: 'Tag atualizada com sucesso'
      };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async deleteTag(id: string): Promise<{ message: string }> {
    try {
      // Verificar se a tag existe
      const { data: existingTag, error: fetchError } = await supabase
        .from('tags')
        .select('id')
        .eq('id', id)
        .single();
      
      if (fetchError || !existingTag) {
        throw new AppError(404, 'Tag não encontrada');
      }
      
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
      
      if (error) throw new AppError(500, error.message);
      
      return { message: 'Tag deletada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  // Métodos auxiliares para mapeamento
  private mapBlogPostToPost(data: any): Post {
    // Converter todas as timestamps de strings para Date
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      content: data.content || '',
      image: data.image,
      published: data.published,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      featured: data.featured,
      authorId: data.authorId,
      categoryId: data.categoryId,
      tags: data.tags || [],
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  private mapCategoryRowToCategory(data: CategoryRow): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }

  private mapTagRowToTag(data: TagRow): Tag {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}

// Exportar uma instância singleton do serviço
export default new BlogSupabaseService(); 