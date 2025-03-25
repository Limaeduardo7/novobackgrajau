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

  /**
   * Cria empresas de exemplo para testes
   */
  async createEmpresasExemplo(req: Request, res: Response) {
    try {
      // Array de empresas de exemplo
      const empresasExemplo = [
        {
          name: "Supermercado São Paulo",
          category: "Supermercado",
          description: "Supermercado completo com os melhores preços da região",
          image: "https://example.com/supermercado.jpg",
          address: "Rua Principal, 123, Centro",
          phone: "(11) 99999-8888",
          state: "SP",
          city: "São Paulo",
          email: "contato@supermercado.com",
          website: "https://supermercado.com",
          social_media: {
            facebook: "https://facebook.com/supermercado",
            instagram: "https://instagram.com/supermercado"
          },
          opening_hours: {
            monday: "08:00 - 20:00",
            tuesday: "08:00 - 20:00",
            wednesday: "08:00 - 20:00",
            thursday: "08:00 - 20:00",
            friday: "08:00 - 20:00",
            saturday: "09:00 - 18:00",
            sunday: "09:00 - 13:00"
          },
          is_featured: true,
          rating: 4.5,
          status: "active" as "active"
        },
        {
          name: "Restaurante Bom Sabor",
          category: "Restaurante",
          description: "O melhor da gastronomia local, ambiente familiar",
          image: "https://example.com/restaurante.jpg",
          address: "Avenida Comercial, 456, Jardins",
          phone: "(11) 97777-6666",
          state: "SP",
          city: "São Paulo",
          email: "contato@restaurante.com",
          website: "https://restaurante.com",
          social_media: {
            facebook: "https://facebook.com/restaurante",
            instagram: "https://instagram.com/restaurante"
          },
          opening_hours: {
            monday: "11:00 - 15:00",
            tuesday: "11:00 - 15:00",
            wednesday: "11:00 - 15:00",
            thursday: "11:00 - 15:00",
            friday: "11:00 - 15:00 / 18:00 - 23:00",
            saturday: "18:00 - 23:00",
            sunday: "12:00 - 16:00"
          },
          is_featured: true,
          rating: 4.8,
          status: "active" as "active"
        },
        {
          name: "Farmácia Saúde",
          category: "Farmácia",
          description: "Medicamentos, perfumaria e atendimento 24h",
          image: "https://example.com/farmacia.jpg",
          address: "Rua das Flores, 789, Vila Nova",
          phone: "(11) 95555-4444",
          state: "SP",
          city: "São Paulo",
          email: "contato@farmacia.com",
          website: "https://farmacia.com",
          social_media: {
            facebook: "https://facebook.com/farmacia",
            instagram: "https://instagram.com/farmacia"
          },
          opening_hours: {
            monday: "24 horas",
            tuesday: "24 horas",
            wednesday: "24 horas",
            thursday: "24 horas",
            friday: "24 horas",
            saturday: "24 horas",
            sunday: "24 horas"
          },
          is_featured: false,
          rating: 4.2,
          status: "active" as "active"
        },
        {
          name: "Pet Shop Animal",
          category: "Pet Shop",
          description: "Tudo para seu animal de estimação, incluindo serviços de banho e tosa",
          image: "https://example.com/petshop.jpg",
          address: "Avenida Animais, 321, Bosque",
          phone: "(11) 93333-2222",
          state: "SP",
          city: "São Paulo",
          email: "contato@petshop.com",
          website: "https://petshop.com",
          social_media: {
            instagram: "https://instagram.com/petshop"
          },
          opening_hours: {
            monday: "09:00 - 18:00",
            tuesday: "09:00 - 18:00",
            wednesday: "09:00 - 18:00",
            thursday: "09:00 - 18:00",
            friday: "09:00 - 18:00",
            saturday: "09:00 - 14:00",
            sunday: null
          },
          is_featured: false,
          rating: 4.0,
          status: "active" as "active"
        },
        {
          name: "Padaria Pão Fresco",
          category: "Padaria",
          description: "Pães artesanais, doces e salgados fresquinhos todos os dias",
          image: "https://example.com/padaria.jpg",
          address: "Rua dos Pães, 654, Centro",
          phone: "(11) 98888-7777",
          state: "SP",
          city: "São Paulo",
          email: "contato@padaria.com",
          social_media: {
            facebook: "https://facebook.com/padaria",
            instagram: "https://instagram.com/padaria"
          },
          opening_hours: {
            monday: "06:00 - 20:00",
            tuesday: "06:00 - 20:00",
            wednesday: "06:00 - 20:00",
            thursday: "06:00 - 20:00",
            friday: "06:00 - 20:00",
            saturday: "06:00 - 20:00",
            sunday: "06:00 - 12:00"
          },
          is_featured: true,
          rating: 4.7,
          status: "active" as "active"
        }
      ];
      
      // Criar as empresas
      const promises = empresasExemplo.map(empresa => EmpresaService.createEmpresa(empresa));
      await Promise.all(promises);
      
      res.status(201).json({
        message: `${empresasExemplo.length} empresas de exemplo criadas com sucesso`,
        count: empresasExemplo.length
      });
    } catch (error: any) {
      console.error('Erro ao criar empresas de exemplo:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Erro ao criar empresas de exemplo', 
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
      }
    }
  }
} 