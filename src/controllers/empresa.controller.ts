import { Request, Response } from 'express';
import EmpresaService from '../services/empresa.factory';
import { AppError } from '../middlewares/errorHandler';

export class EmpresaController {
  /**
   * Lista empresas com paginação e filtros
   */
  async getEmpresas(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        category: req.query.category as string | undefined,
        state: req.query.state as string | undefined,
        city: req.query.city as string | undefined,
        search: req.query.search as string | undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      const result = await EmpresaService.getEmpresas(params);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresas' });
      }
    }
  }

  /**
   * Retorna detalhes de uma empresa específica
   */
  async getEmpresaById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um número
      const empresaId = parseInt(id);
      if (isNaN(empresaId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      const result = await EmpresaService.getEmpresaById(empresaId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresa' });
      }
    }
  }

  /**
   * Cria uma nova empresa
   */
  async createEmpresa(req: Request, res: Response) {
    try {
      console.log('Dados recebidos no POST:', JSON.stringify(req.body, null, 2));
      
      // Processamento e validação de tipos
      const empresaData = {
        name: req.body.name ? String(req.body.name).trim() : '',
        category: req.body.category ? String(req.body.category).trim() : '',
        description: req.body.description ? String(req.body.description).trim() : null,
        image: req.body.image || null,
        address: req.body.address ? String(req.body.address).trim() : null,
        phone: req.body.phone ? String(req.body.phone).trim() : null,
        state: req.body.state ? String(req.body.state).trim() : '',
        city: req.body.city ? String(req.body.city).trim() : '',
        email: req.body.email || null,
        website: req.body.website || null,
        social_media: req.body.social_media || null,
        opening_hours: req.body.opening_hours || null,
        is_featured: req.body.is_featured === true,
        rating: req.body.rating ? Number(req.body.rating) : null,
        status: req.body.status || 'active'
      };
      
      // Validar campos obrigatórios
      if (!empresaData.name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      
      if (!empresaData.category) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
      }
      
      if (!empresaData.state) {
        return res.status(400).json({ error: 'Estado é obrigatório' });
      }
      
      if (!empresaData.city) {
        return res.status(400).json({ error: 'Cidade é obrigatória' });
      }
      
      const result = await EmpresaService.createEmpresa(empresaData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Erro detalhado na criação de empresa:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Erro ao criar empresa', 
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
      }
    }
  }

  /**
   * Atualiza uma empresa existente
   */
  async updateEmpresa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um número
      const empresaId = parseInt(id);
      if (isNaN(empresaId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      const result = await EmpresaService.updateEmpresa(empresaId, req.body);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar empresa' });
      }
    }
  }

  /**
   * Exclui uma empresa
   */
  async deleteEmpresa(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um número
      const empresaId = parseInt(id);
      if (isNaN(empresaId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      const result = await EmpresaService.deleteEmpresa(empresaId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao deletar empresa' });
      }
    }
  }

  /**
   * Busca empresas por termo
   */
  async searchEmpresas(req: Request, res: Response) {
    try {
      // Aceitar tanto 'query' quanto 'term' para compatibilidade
      const searchTerm = (req.query.query || req.query.term) as string;
      const category = req.query.category as string | undefined;
      const state = req.query.state as string | undefined;
      const city = req.query.city as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      // Permitir busca vazia para retornar todos os resultados
      const result = await EmpresaService.searchEmpresas(
        searchTerm || '', 
        category, 
        state, 
        city, 
        limit, 
        page
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresas' });
      }
    }
  }

  /**
   * Lista empresas em destaque
   */
  async getEmpresasEmDestaque(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await EmpresaService.getEmpresasEmDestaque(limit);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresas em destaque' });
      }
    }
  }

  /**
   * Lista empresas por categoria
   */
  async getEmpresasByCategory(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      if (!category) {
        return res.status(400).json({ error: 'Categoria é obrigatória' });
      }
      
      const result = await EmpresaService.getEmpresasByCategory(category, limit, page);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresas por categoria' });
      }
    }
  }

  /**
   * Lista as categorias disponíveis
   */
  async getCategorias(req: Request, res: Response) {
    try {
      const result = await EmpresaService.getCategorias();
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
      }
    }
  }
} 