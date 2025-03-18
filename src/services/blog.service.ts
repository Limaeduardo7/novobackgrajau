import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { AppError } from '../middlewares/errorHandler';
import { PaginationParams, Post, Category, Tag } from '../types/blog';

const prisma = new PrismaClient();

export class BlogService {
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
      order = 'desc'
    } = params;

    const where = {
      ...(published !== undefined && { published }),
      ...(featured !== undefined && { featured }),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(tags && tags.length > 0 && {
        tags: {
          some: {
            tagId: { in: tags }
          }
        }
      })
    };

    const total = await prisma.post.count({ where });
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        [sortBy]: order
      },
      skip,
      take: limit
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
  }

  async getPostById(id: string) {
    const post = await prisma.post.findUnique({
      where: { id },
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
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    const post = await prisma.post.create({
      data: {
        ...data,
        tags: {
          create: data.tags?.map(tagId => ({
            tag: { connect: { id: tagId } }
          }))
        }
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

    return { data: post, message: 'Post criado com sucesso' };
  }

  async updatePost(id: string, data: Partial<Post>) {
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        ...(data.tags && {
          tags: {
            deleteMany: {},
            create: data.tags.map(tagId => ({
              tag: { connect: { id: tagId } }
            }))
          }
        })
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

    return { data: post, message: 'Post atualizado com sucesso' };
  }

  async deletePost(id: string) {
    await prisma.post.delete({
      where: { id }
    });

    return { message: 'Post deletado com sucesso' };
  }

  // Categories
  async getCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    return { data: categories };
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const slug = slugify(data.name, { lower: true });
    
    const category = await prisma.category.create({
      data: {
        ...data,
        slug
      }
    });

    return { data: category, message: 'Categoria criada com sucesso' };
  }

  async updateCategory(id: string, data: Partial<Category>) {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        ...(data.name && { slug: slugify(data.name, { lower: true }) })
      }
    });

    return { data: category, message: 'Categoria atualizada com sucesso' };
  }

  async deleteCategory(id: string) {
    await prisma.category.delete({
      where: { id }
    });

    return { message: 'Categoria deletada com sucesso' };
  }

  // Tags
  async getTags() {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    return { data: tags };
  }

  async createTag(data: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) {
    const slug = slugify(data.name, { lower: true });
    
    const tag = await prisma.tag.create({
      data: {
        ...data,
        slug
      }
    });

    return { data: tag, message: 'Tag criada com sucesso' };
  }

  async updateTag(id: string, data: Partial<Tag>) {
    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...data,
        ...(data.name && { slug: slugify(data.name, { lower: true }) })
      }
    });

    return { data: tag, message: 'Tag atualizada com sucesso' };
  }

  async deleteTag(id: string) {
    await prisma.tag.delete({
      where: { id }
    });

    return { message: 'Tag deletada com sucesso' };
  }
} 