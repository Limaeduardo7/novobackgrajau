import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { AppError } from '../middlewares/errorHandler';
import { PaginationParams, Post, Category, Tag } from '../types/blog';
import retry from '../utils/retry';

const prisma = new PrismaClient();

export class BlogPrismaService {
  // Posts
  async getPosts(params: PaginationParams) {
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

    try {
      // Construir where clause
      const where: any = {};
      
      if (published !== undefined) {
        where.published = published;
      }
      
      if (featured !== undefined) {
        where.featured = featured;
      }
      
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      if (validCategoryOnly) {
        where.categoryId = { not: null };
      }
      
      if (authorId) {
        where.authorId = authorId;
      }
      
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
      
      if (tags && tags.length > 0) {
        where.tags = { hasEvery: tags };
      }

      // Executar query com retry
      const [posts, totalCount] = await Promise.all([
        retry(() => prisma.blogPost.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sortBy]: order }
        })),
        retry(() => prisma.blogPost.count({ where }))
      ]);

      const total = totalCount as number;

      return {
        data: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      console.error('Falha ao buscar posts do blog:', error);
      throw new AppError(500, error.message);
    }
  }

  async getPostById(id: string, options: { validCategoryOnly?: boolean } = {}) {
    const { validCategoryOnly = false } = options;
    
    try {
      const where: any = { id };
      if (validCategoryOnly) {
        where.categoryId = { not: null };
      }
      
      const post = await retry(() => prisma.blogPost.findFirst({ where }));
      
      if (!post) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      return { data: post };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, options: { allowNullCategory?: boolean } = {}) {
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
        const category = await retry(() => prisma.category.findUnique({
          where: { id: data.categoryId as string }
        }));
        
        if (!category) {
          throw new AppError(400, 'Categoria não encontrada');
        }
      }
      
      // Gerar slug
      const slug = slugify(data.title, { lower: true, strict: true });
      
      // Criar post
      const post = await retry(() => prisma.blogPost.create({
        data: {
          title: data.title,
          slug,
          content: data.content || '',
          image: data.image,
          published: data.published || false,
          publishedAt: data.published ? new Date() : null,
          featured: data.featured || false,
          authorId: data.authorId || null,
          categoryId: data.categoryId || null,
          tags: data.tags || []
        }
      }));
      
      return { data: post, message: 'Post criado com sucesso' };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async updatePost(id: string, data: Partial<Post>) {
    try {
      // Verificar se o post existe
      const existingPost = await retry(() => prisma.blogPost.findUnique({
        where: { id }
      }));
      
      if (!existingPost) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      // Se categoryId estiver definido, verificar se a categoria existe
      if (data.categoryId) {
        const category = await retry(() => prisma.category.findUnique({
          where: { id: data.categoryId as string }
        }));
        
        if (!category) {
          throw new AppError(400, 'Categoria não encontrada');
        }
      }
      
      // Preparar dados para atualização
      const updateData: any = {
        ...data,
        updatedAt: new Date()
      };
      
      // Se o título foi atualizado, gerar novo slug
      if (data.title) {
        updateData.slug = slugify(data.title, { lower: true, strict: true });
      }
      
      // Se o status de publicação mudou para true, atualizar publishedAt
      if (data.published === true && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      } else if (data.published === false) {
        updateData.publishedAt = null;
      }
      
      // Atualizar post
      const post = await retry(() => prisma.blogPost.update({
        where: { id },
        data: updateData
      }));
      
      return { data: post, message: 'Post atualizado com sucesso' };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message);
    }
  }

  async deletePost(id: string) {
    try {
      await retry(() => prisma.blogPost.delete({
        where: { id }
      }));
      
      return { message: 'Post deletado com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  // Categories
  async getCategories() {
    try {
      const categories = await retry(() => prisma.category.findMany());
      return { data: categories };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      const slug = slugify(data.name, { lower: true, strict: true });
      
      const category = await retry(() => prisma.category.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null
        }
      }));
      
      return { data: category, message: 'Categoria criada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async updateCategory(id: string, data: Partial<Category>) {
    try {
      const updateData: any = { ...data };
      
      if (data.name) {
        updateData.slug = slugify(data.name, { lower: true, strict: true });
      }
      
      const category = await retry(() => prisma.category.update({
        where: { id },
        data: updateData
      }));
      
      return { data: category, message: 'Categoria atualizada com sucesso' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError(400, 'Já existe uma categoria com este nome');
      }
      throw new AppError(500, error.message);
    }
  }

  async deleteCategory(id: string) {
    try {
      await retry(() => prisma.category.delete({
        where: { id }
      }));
      
      return { message: 'Categoria deletada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  // Tags
  async getTags() {
    try {
      const tags = await retry(() => prisma.tag.findMany());
      return { data: tags };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (!data.name || typeof data.name !== 'string') {
        throw new AppError(400, 'Nome é obrigatório e deve ser uma string');
      }
      
      const slug = slugify(data.name, { lower: true, strict: true });
      
      const tag = await retry(() => prisma.tag.create({
        data: {
          name: data.name,
          slug,
          description: data.description || null
        }
      }));
      
      return { data: tag, message: 'Tag criada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }

  async updateTag(id: string, data: Partial<Tag>) {
    try {
      const updateData: any = { ...data };
      
      if (data.name) {
        updateData.slug = slugify(data.name, { lower: true, strict: true });
      }
      
      const tag = await retry(() => prisma.tag.update({
        where: { id },
        data: updateData
      }));
      
      return { data: tag, message: 'Tag atualizada com sucesso' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new AppError(400, 'Já existe uma tag com este nome');
      }
      throw new AppError(500, error.message);
    }
  }

  async deleteTag(id: string) {
    try {
      await retry(() => prisma.tag.delete({
        where: { id }
      }));
      
      return { message: 'Tag deletada com sucesso' };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
  }
}

export default new BlogPrismaService(); 