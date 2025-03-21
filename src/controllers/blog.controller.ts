import { Request, Response } from 'express';
import { BlogSupabaseService } from '../services/blog.supabase.service';
import { AppError } from '../middlewares/errorHandler';

// Instanciar o serviço
const blogService = new BlogSupabaseService();

export class BlogController {
  // Posts
  async getPosts(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        published: req.query.published === 'true' ? true : req.query.published === 'false' ? false : undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        categoryId: req.query.categoryId as string | undefined,
        authorId: req.query.authorId as string | undefined,
        search: req.query.search as string | undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags as string[] : [req.query.tags as string]) : undefined,
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      const result = await blogService.getPosts(params);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar posts' });
      }
    }
  }

  async getPostById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.getPostById(id);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar post' });
      }
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      const result = await blogService.createPost(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao criar post' });
      }
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.updatePost(id, req.body);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar post' });
      }
    }
  }

  async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.deletePost(id);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao deletar post' });
      }
    }
  }

  // Categories
  async getCategories(req: Request, res: Response) {
    try {
      const result = await blogService.getCategories();
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
      }
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const result = await blogService.createCategory(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao criar categoria' });
      }
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.updateCategory(id, req.body);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar categoria' });
      }
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.deleteCategory(id);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao deletar categoria' });
      }
    }
  }

  // Tags
  async getTags(req: Request, res: Response) {
    try {
      const result = await blogService.getTags();
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar tags' });
      }
    }
  }

  async createTag(req: Request, res: Response) {
    try {
      const result = await blogService.createTag(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao criar tag' });
      }
    }
  }

  async updateTag(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.updateTag(id, req.body);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar tag' });
      }
    }
  }

  async deleteTag(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await blogService.deleteTag(id);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao deletar tag' });
      }
    }
  }
} 