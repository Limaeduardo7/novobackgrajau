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

    const where: Prisma.BlogPostWhereInput = {
      ...(published !== undefined && { published }),
      ...(featured !== undefined && { featured }),
      ...(categoryId && { categoryId }),
      ...(authorId && { authorId }),
      ...(tags && tags.length > 0 && {
        tags: {
          hasEvery: tags
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

    const total = await prisma.blogPost.count({ where });
    const totalPages = Math.ceil(total / limit);

    const [posts, totalPosts] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          [sortBy]: order
        },
        include: {
          category: true
        }
      }),
      prisma.blogPost.count({ where })
    ]);

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
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!post) {
      throw new AppError(404, 'Post não encontrado');
    }

    return { data: post };
  }

  async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) {
    const postData: any = {
      title: data.title,
      content: data.content,
      image: data.image,
      published: data.published,
      featured: data.featured,
      authorId: data.authorId,
      slug: slugify(data.title, { lower: true, strict: true }),
      tags: data.tags || []
    };

    if (data.categoryId) {
      postData.categoryId = data.categoryId;
    }

    const post = await prisma.blogPost.create({
      data: postData,
      include: {
        category: true
      }
    });

    return { data: post };
  }

  async updatePost(id: string, data: Partial<Post>) {
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      throw new AppError(404, 'Post não encontrado');
    }

    const updateData: any = {
      ...data,
      ...(data.title ? { slug: slugify(data.title, { lower: true, strict: true }) } : {})
    };
    
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    return { data: post };
  }

  async deletePost(id: string) {
    await prisma.blogPost.delete({
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
    try {
      const tags = await prisma.tag.findMany();
      return { data: tags };
    } catch (error: any) {
      throw new AppError(500, error.message);
    }
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