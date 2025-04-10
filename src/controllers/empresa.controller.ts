import { Request, Response } from 'express';
import EmpresaService from '../services/empresa.factory';
import { AppError } from '../utils/AppError';

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
      console.log('Dados recebidos no POST:', req.body);
      
      // Verificar se o corpo da requisição está vazio
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: 'Corpo da requisição vazio', 
          message: 'É necessário fornecer os dados da empresa no corpo da requisição',
          campos_obrigatorios: ['name', 'category', 'state', 'city']
        });
      }
      
      // Mapear campos em português para inglês (compatibilidade frontend-backend)
      const dadosOriginal = req.body;
      const mapeamentoCampos = {
        nome: 'name',
        categoria: 'category',
        descricao: 'description',
        endereco: 'address',
        telefone: 'phone',
        email: 'email',
        documento: 'document',
        tipoDocumento: 'document_type',
        horarioFuncionamento: 'opening_hours',
        servicos: 'services',
        cidade: 'city',
        estado: 'state',
        status: 'status',
        imagem: 'image',
        website: 'website',
        redesSociais: 'social_media',
        emDestaque: 'is_featured'
      };
      
      // Criar um novo objeto com os campos mapeados
      const dadosMapeados: Record<string, any> = {};
      
      // Transferir os dados mapeando os nomes dos campos
      Object.entries(dadosOriginal).forEach(([chave, valor]) => {
        const chaveEmIngles = mapeamentoCampos[chave as keyof typeof mapeamentoCampos];
        if (chaveEmIngles) {
          dadosMapeados[chaveEmIngles] = valor;
        } else {
          // Manter campos que não precisam de mapeamento
          dadosMapeados[chave] = valor;
        }
      });
      
      // Remover explicitamente o campo 'slug' que não existe na tabela
      delete dadosMapeados.slug;
      
      console.log('Dados mapeados:', dadosMapeados);
      
      // Processamento e validação de tipos usando os dados mapeados
      const empresaData = {
        name: dadosMapeados.name ? String(dadosMapeados.name).trim() : '',
        category: dadosMapeados.category ? String(dadosMapeados.category).trim() : '',
        description: dadosMapeados.description ? String(dadosMapeados.description).trim() : null,
        image: dadosMapeados.image || null,
        address: dadosMapeados.address ? String(dadosMapeados.address).trim() : null,
        phone: dadosMapeados.phone ? String(dadosMapeados.phone).trim() : null,
        state: dadosMapeados.state ? String(dadosMapeados.state).trim() : '',
        city: dadosMapeados.city ? String(dadosMapeados.city).trim() : '',
        email: dadosMapeados.email || null,
        website: dadosMapeados.website || null,
        social_media: dadosMapeados.social_media || null,
        opening_hours: dadosMapeados.opening_hours || null,
        is_featured: dadosMapeados.is_featured === true,
        rating: dadosMapeados.rating ? Number(dadosMapeados.rating) : null,
        status: dadosMapeados.status || 'pendente'
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
      
      // Garantir que não há campo 'slug' em nenhum nível do objeto
      if ('slug' in empresaData) delete empresaData.slug;
      
      console.log('Objeto final antes de enviar para o serviço:', JSON.stringify(empresaData, null, 2));
      
      const result = await EmpresaService.createEmpresa(empresaData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Erro ao criar empresa:', error);
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
   * Lista empresas com status pendente
   */
  async getPendingEmpresas(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        status: 'pendente' as 'pendente',
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      const result = await EmpresaService.getEmpresas(params);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar empresas pendentes' });
      }
    }
  }

  /**
   * Atualiza o status de uma empresa
   */
  async updateEmpresaStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      
      // Validar o ID
      const empresaId = parseInt(id);
      if (isNaN(empresaId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      // Validar o status
      if (!['aprovado', 'rejeitado', 'pendente'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use aprovado, rejeitado ou pendente.' });
      }
      
      const result = await EmpresaService.updateEmpresaStatus(
        empresaId, 
        status as 'aprovado' | 'rejeitado' | 'pendente',
        message
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar status da empresa' });
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
          status: "pendente" as "pendente"
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
          status: "pendente" as "pendente"
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
          status: "pendente" as "pendente"
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
          status: "pendente" as "pendente"
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
          status: "pendente" as "pendente"
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

export default new EmpresaController(); 
