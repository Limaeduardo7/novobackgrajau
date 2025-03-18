import { PaginationParams, Post, Category, Tag } from '../types/blog';
import prisma from '../lib/prisma';
import { AppError } from '../utils/AppError';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';

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

    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      ...(published !== undefined && { published }),
      ...(featured !== undefined && { featured }),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
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
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
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
    const postData: Prisma.PostCreateInput = {
      title: data.title,
      content: data.content,
      image: data.image,
      published: data.published,
      featured: data.featured,
      publishedAt: data.published ? new Date() : null,
      slug: slugify(data.title, { lower: true, strict: true }),
      author: {
        connect: { id: data.authorId }
      },
      category: {
        connect: { id: data.categoryId }
      },
      ...(data.tags && {
        tags: {
          create: data.tags.map(tagId => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      })
    };

    const post = await prisma.post.create({
      data: postData,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return { data: post };
  }

  async updatePost(id: string, data: Partial<Post>) {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        tags: true
      }
    });

    if (!existingPost) {
      throw new AppError(404, 'Post não encontrado');
    }

    const updateData: Prisma.PostUpdateInput = {
      ...(data.title && {
        title: data.title,
        slug: slugify(data.title, { lower: true, strict: true })
      }),
      ...(data.content && { content: data.content }),
      ...(data.image && { image: data.image }),
      ...(data.published !== undefined && {
        published: data.published,
        publishedAt: data.published ? new Date() : null
      }),
      ...(data.featured !== undefined && { featured: data.featured }),
      ...(data.categoryId && {
        category: {
          connect: { id: data.categoryId }
        }
      }),
      ...(data.authorId && {
        author: {
          connect: { id: data.authorId }
        }
      }),
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

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        },
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return { data: post };
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