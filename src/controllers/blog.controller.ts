import { Request, Response } from 'express';
import BlogService from '../services/blog.factory';
import { AppError } from '../middlewares/errorHandler';

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

      const result = await BlogService.getPosts(params);
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
      console.log(`=== CONTROLLER: INÍCIO DA BUSCA DE POST POR ID ===`);
      console.log(`Parâmetros recebidos:`, req.params);
      const { id } = req.params;
      console.log(`ID extraído: "${id}"`);
      
      // Validar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error(`ID inválido: "${id}" não é um UUID válido`);
        return res.status(400).json({ error: 'ID inválido. Formato UUID esperado.' });
      }
      
      console.log(`Chamando serviço para buscar post com ID: ${id}`);
      const result = await BlogService.getPostById(id);
      
      console.log(`Post encontrado com sucesso:`, result);
      console.log(`=== CONTROLLER: FIM DA BUSCA DE POST POR ID ===`);
      
      res.json(result);
    } catch (error: any) {
      console.error(`=== CONTROLLER: ERRO NA BUSCA DE POST POR ID ===`);
      console.error(`Mensagem: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar post' });
      }
    }
  }

  async createPost(req: Request, res: Response) {
    try {
      console.log('Dados recebidos no POST:', JSON.stringify(req.body, null, 2));
      console.log('Headers recebidos:', JSON.stringify(req.headers, null, 2));
      
      // Processamento e validação de tipos
      const postData = {
        title: req.body.title ? String(req.body.title).trim() : '',
        content: req.body.content ? String(req.body.content).trim() : '',
        slug: req.body.slug ? String(req.body.slug).trim() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        categoryId: req.body.categoryId ? String(req.body.categoryId) : null,
        tags: Array.isArray(req.body.tags) ? req.body.tags.map((tag: any) => String(tag)) : [],
        published: req.body.published === true,
        featured: req.body.featured === true,
        publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null,
        authorId: req.body.authorId ? String(req.body.authorId) : null,
        image: req.body.image ? String(req.body.image) : null
      };
      
      console.log('Dados processados após conversão de tipos:', JSON.stringify(postData, null, 2));
      
      // Validar campos obrigatórios
      if (!postData.title) {
        return res.status(400).json({ error: 'Título é obrigatório' });
      }
      
      if (!postData.content) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
      }
      
      if (!postData.categoryId) {
        return res.status(400).json({ error: 'ID da categoria é obrigatório' });
      }
      
      const result = await BlogService.createPost(postData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Erro detalhado na criação de post:', error);
      console.error('Stack trace:', error.stack);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Erro ao criar post', 
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
      }
    }
  }

  async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await BlogService.updatePost(id, req.body);
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
      const result = await BlogService.deletePost(id);
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
      const result = await BlogService.getCategories();
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
      const result = await BlogService.createCategory(req.body);
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
      const result = await BlogService.updateCategory(id, req.body);
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
      const result = await BlogService.deleteCategory(id);
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
      const result = await BlogService.getTags();
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
      const result = await BlogService.createTag(req.body);
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
      const result = await BlogService.updateTag(id, req.body);
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
      const result = await BlogService.deleteTag(id);
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