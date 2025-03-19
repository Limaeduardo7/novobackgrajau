import { PaginationParams, Post, Category, Tag } from '../types/blog';
import prisma from '../lib/prisma';
import { AppError } from '../middlewares/errorHandler';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';

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

    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      ...(published !== undefined && { published }),
      ...(featured !== undefined && { featured }),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
      ...(validCategoryOnly === true && { 
        NOT: {
          categoryId: null
        }
      }),
      ...(tags?.length && {
        tags: {
          some: {
            tagId: {
              in: tags
            }
          }
        }
      }),
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            content: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      })
    };

    try {
      const total = await prisma.post.count({ where });
      const totalPages = Math.ceil(total / limit);
  
      const posts = await prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: order
        },
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
  
      return {
        data: posts,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error("Falha ao buscar posts do blog:", error);
      throw new AppError(500, "Erro ao buscar posts. Verifique os logs para mais detalhes.");
    }
  }

  async getPostById(id: string, options: { validCategoryOnly?: boolean } = {}) {
    const { validCategoryOnly = false } = options;
    
    try {
      const where: Prisma.PostWhereInput = { 
        id,
        ...(validCategoryOnly === true && { 
          NOT: {
            categoryId: null
          }
        })
      };
      
      const post = await prisma.post.findFirst({
        where,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
  
      if (!post) {
        throw new AppError(404, 'Post não encontrado');
      }
  
      return { data: post };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Erro ao buscar post por ID:", error);
      throw new AppError(500, "Erro ao buscar post. Verifique os logs para mais detalhes.");
    }
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>, options: { allowNullCategory?: boolean } = {}) {
    const { allowNullCategory = false } = options;
    
    try {
      // Validar dados obrigatórios
      if (!data.title || typeof data.title !== 'string') {
        throw new AppError(400, 'Título é obrigatório e deve ser uma string');
      }
  
      if (!data.authorId) {
        throw new AppError(400, 'ID do autor é obrigatório');
      }
      
      // Verificar se categoryId está presente quando necessário
      if (!allowNullCategory && (data.categoryId === null || data.categoryId === undefined)) {
        throw new AppError(400, 'ID da categoria é obrigatório');
      }
      
      // Verificar se o autor existe
      const author = await prisma.user.findUnique({
        where: { id: data.authorId }
      });
  
      if (!author) {
        throw new AppError(400, 'Autor não encontrado. ID fornecido: ' + data.authorId);
      }
      
      // Se categoryId estiver definido, verificar se a categoria existe
      if (data.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: data.categoryId }
        });
          
        if (!category) {
          throw new AppError(400, 'Categoria não encontrada. ID fornecido: ' + data.categoryId);
        }
      }
      
      const postData: any = {
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || data.content.substring(0, 200),
        image: data.image,
        published: data.published,
        featured: data.featured,
        authorId: data.authorId,
        slug: slugify(data.title, { lower: true, strict: true }),
        tags: data.tags ? {
          create: data.tags.map(tagId => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        } : undefined
      };
  
      if (data.categoryId) {
        postData.categoryId = data.categoryId;
      }
  
      const post = await prisma.post.create({
        data: postData,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
  
      return { data: post, message: 'Post criado com sucesso' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Erro ao criar post:", error);
      throw new AppError(500, "Erro ao criar post. Verifique os logs para mais detalhes.");
    }
  }

  async updatePost(id: string, data: Partial<Post>, options: { allowNullCategory?: boolean } = {}) {
    const { allowNullCategory = false } = options;
    
    try {
      const existingPost = await prisma.post.findUnique({
        where: { id },
        include: {
          tags: true
        }
      });
  
      if (!existingPost) {
        throw new AppError(404, 'Post não encontrado');
      }
      
      // Verificar se a atualização está tentando definir categoryId como nulo
      if (!allowNullCategory && data.categoryId === null) {
        throw new AppError(400, 'Não é permitido definir categoryId como nulo');
      }
  
      const updateData: any = {
        ...(data.title && {
          title: data.title,
          slug: slugify(data.title, { lower: true, strict: true })
        }),
        ...(data.content && {
          content: data.content,
          excerpt: data.excerpt || data.content.substring(0, 200)
        }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.published !== undefined && {
          published: data.published,
          ...(data.published ? { publishedAt: new Date() } : {})
        }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.authorId && { authorId: data.authorId }),
        ...(data.tags && {
          tags: {
            deleteMany: {},
            create: data.tags.map(tagId => ({
              tag: {
                connect: { id: tagId }
              }
            }))
          }
        }),
        updatedAt: new Date()
      };
  
      if (data.categoryId !== undefined) {
        updateData.categoryId = data.categoryId;
      }
  
      const post = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          tags: {
            include: {
              tag: true
            }
          }
        }
      });
  
      return { data: post, message: 'Post atualizado com sucesso' };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error("Erro ao atualizar post:", error);
      throw new AppError(500, "Erro ao atualizar post. Verifique os logs para mais detalhes.");
    }
  }

  async deletePost(id: string) {
    try {
      await prisma.post.delete({
        where: { id }
      });
  
      return { message: 'Post deletado com sucesso' };
    } catch (error) {
      console.error("Erro ao deletar post:", error);
      throw new AppError(500, "Erro ao deletar post. Verifique os logs para mais detalhes.");
    }
  }

  // Categories
  async getCategories() {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: { posts: true }
          }
        }
      });
  
      return { data: categories };
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
      throw new AppError(500, "Erro ao buscar categorias. Verifique os logs para mais detalhes.");
    }
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const slug = slugify(data.name, { lower: true });
      
      const category = await prisma.category.create({
        data: {
          ...data,
          slug
        }
      });
  
      return { data: category, message: 'Categoria criada com sucesso' };
    } catch (error) {
      console.error("Erro ao criar categoria:", error);
      throw new AppError(500, "Erro ao criar categoria. Verifique os logs para mais detalhes.");
    }
  }

  async updateCategory(id: string, data: Partial<Category>) {
    try {
      const category = await prisma.category.update({
        where: { id },
        data: {
          ...data,
          ...(data.name && { slug: slugify(data.name, { lower: true }) })
        }
      });
  
      return { data: category, message: 'Categoria atualizada com sucesso' };
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error);
      throw new AppError(500, "Erro ao atualizar categoria. Verifique os logs para mais detalhes.");
    }
  }

  async deleteCategory(id: string) {
    try {
      await prisma.category.delete({
        where: { id }
      });
  
      return { message: 'Categoria deletada com sucesso' };
    } catch (error) {
      console.error("Erro ao deletar categoria:", error);
      throw new AppError(500, "Erro ao deletar categoria. Verifique os logs para mais detalhes.");
    }
  }

  // Tags
  async getTags() {
    try {
      const tags = await prisma.tag.findMany({
        include: {
          _count: {
            select: { posts: true }
          }
        }
      });
  
      return { data: tags };
    } catch (error) {
      console.error("Erro ao buscar tags:", error);
      throw new AppError(500, "Erro ao buscar tags. Verifique os logs para mais detalhes.");
    }
  }

  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const slug = slugify(data.name, { lower: true });
      
      const tag = await prisma.tag.create({
        data: {
          ...data,
          slug
        }
      });
  
      return { data: tag, message: 'Tag criada com sucesso' };
    } catch (error) {
      console.error("Erro ao criar tag:", error);
      throw new AppError(500, "Erro ao criar tag. Verifique os logs para mais detalhes.");
    }
  }

  async updateTag(id: string, data: Partial<Tag>) {
    try {
      const tag = await prisma.tag.update({
        where: { id },
        data: {
          ...data,
          ...(data.name && { slug: slugify(data.name, { lower: true }) })
        }
      });
  
      return { data: tag, message: 'Tag atualizada com sucesso' };
    } catch (error) {
      console.error("Erro ao atualizar tag:", error);
      throw new AppError(500, "Erro ao atualizar tag. Verifique os logs para mais detalhes.");
    }
  }

  async deleteTag(id: string) {
    try {
      await prisma.tag.delete({
        where: { id }
      });
  
      return { message: 'Tag deletada com sucesso' };
    } catch (error) {
      console.error("Erro ao deletar tag:", error);
      throw new AppError(500, "Erro ao deletar tag. Verifique os logs para mais detalhes.");
    }
  }
} 