import { Request, Response } from 'express';
import ProfissionalService from '../services/profissional.factory';
import { AppError } from '../middlewares/errorHandler';

export class ProfissionalController {
  /**
   * Lista profissionais com paginação e filtros
   */
  async getProfissionais(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        ocupacao: req.query.ocupacao as string | undefined,
        estado: req.query.estado as string | undefined,
        cidade: req.query.cidade as string | undefined,
        search: req.query.search as string | undefined,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      const result = await ProfissionalService.getProfissionais(params);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar profissionais' });
      }
    }
  }

  /**
   * Retorna detalhes de um profissional específico
   */
  async getProfissionalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um número
      const profissionalId = parseInt(id);
      if (isNaN(profissionalId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      const result = await ProfissionalService.getProfissionalById(profissionalId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar profissional' });
      }
    }
  }

  /**
   * Retorna detalhes do próprio perfil de profissional (para usuários autenticados)
   */
  async getMyProfile(req: Request, res: Response) {
    try {
      // @ts-ignore - userId é adicionado pelo middleware de autenticação
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      const result = await ProfissionalService.getProfissionalByUserId(userId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar seu perfil de profissional' });
      }
    }
  }

  /**
   * Cria um novo profissional
   */
  async createProfissional(req: Request, res: Response) {
    try {
      console.log('Dados recebidos no POST:', JSON.stringify(req.body, null, 2));
      
      // @ts-ignore - userId é adicionado pelo middleware de autenticação
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Processamento e validação de tipos
      const profissionalData = {
        name: req.body.name ? String(req.body.name).trim() : '',
        ocupacao: req.body.ocupacao ? String(req.body.ocupacao).trim() : '',
        descricao: req.body.descricao ? String(req.body.descricao).trim() : null,
        foto: req.body.foto || null,
        endereco: req.body.endereco ? String(req.body.endereco).trim() : null,
        telefone: req.body.telefone ? String(req.body.telefone).trim() : null,
        estado: req.body.estado ? String(req.body.estado).trim() : '',
        cidade: req.body.cidade ? String(req.body.cidade).trim() : '',
        email: req.body.email || null,
        website: req.body.website || null,
        redes_sociais: req.body.redes_sociais || null,
        disponibilidade: req.body.disponibilidade || null,
        is_featured: false, // Novos profissionais começam sem destaque
        avaliacao: req.body.avaliacao ? Number(req.body.avaliacao) : null,
        status: 'PENDING' as 'PENDING' // Novos profissionais começam como pendentes
      };
      
      // Validar campos obrigatórios
      if (!profissionalData.name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
      }
      
      if (!profissionalData.ocupacao) {
        return res.status(400).json({ error: 'Ocupação é obrigatória' });
      }
      
      if (!profissionalData.estado) {
        return res.status(400).json({ error: 'Estado é obrigatório' });
      }
      
      if (!profissionalData.cidade) {
        return res.status(400).json({ error: 'Cidade é obrigatória' });
      }
      
      const result = await ProfissionalService.createProfissional(profissionalData, userId);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Erro detalhado na criação de profissional:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Erro ao criar profissional', 
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
      }
    }
  }

  /**
   * Atualiza o próprio perfil de profissional
   */
  async updateMyProfile(req: Request, res: Response) {
    try {
      // @ts-ignore - userId é adicionado pelo middleware de autenticação
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Buscar o profissional do usuário
      try {
        const { data: profissional } = await ProfissionalService.getProfissionalByUserId(userId);
        
        // Atualizar o perfil
        const result = await ProfissionalService.updateProfissional(
          profissional.id, 
          req.body, 
          userId,
          false // não é admin
        );
        
        res.json(result);
      } catch (error: any) {
        if (error instanceof AppError && error.statusCode === 404) {
          return res.status(404).json({ error: 'Você não possui um perfil de profissional' });
        }
        throw error;
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar seu perfil de profissional' });
      }
    }
  }

  /**
   * Exclui o próprio perfil de profissional
   */
  async deleteMyProfile(req: Request, res: Response) {
    try {
      // @ts-ignore - userId é adicionado pelo middleware de autenticação
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Buscar o profissional do usuário
      try {
        const { data: profissional } = await ProfissionalService.getProfissionalByUserId(userId);
        
        // Excluir o perfil
        const result = await ProfissionalService.deleteProfissional(
          profissional.id, 
          userId,
          false // não é admin
        );
        
        res.json(result);
      } catch (error: any) {
        if (error instanceof AppError && error.statusCode === 404) {
          return res.status(404).json({ error: 'Você não possui um perfil de profissional' });
        }
        throw error;
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao excluir seu perfil de profissional' });
      }
    }
  }

  /**
   * Busca profissionais por termo
   */
  async searchProfissionais(req: Request, res: Response) {
    try {
      // Aceitar tanto 'query' quanto 'term' para compatibilidade
      const searchTerm = (req.query.query || req.query.term) as string;
      const ocupacao = req.query.ocupacao as string | undefined;
      const estado = req.query.estado as string | undefined;
      const cidade = req.query.cidade as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      
      // Permitir busca vazia para retornar todos os resultados
      const result = await ProfissionalService.searchProfissionais(
        searchTerm || '', 
        ocupacao, 
        estado, 
        cidade, 
        limit, 
        page
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar profissionais' });
      }
    }
  }

  /**
   * Lista profissionais em destaque
   */
  async getProfissionaisEmDestaque(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const result = await ProfissionalService.getProfissionaisEmDestaque(limit);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar profissionais em destaque' });
      }
    }
  }

  /**
   * Lista ocupações disponíveis
   */
  async getOcupacoes(req: Request, res: Response) {
    try {
      const result = await ProfissionalService.getOcupacoes();
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar ocupações' });
      }
    }
  }

  /**
   * [ADMIN] Lista todos os profissionais (incluindo pendentes e rejeitados)
   */
  async getAllProfissionais(req: Request, res: Response) {
    try {
      const params = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        ocupacao: req.query.ocupacao as string | undefined,
        status: req.query.status as 'APPROVED' | 'REJECTED' | 'PENDING' | 'ALL' | undefined,
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      // Status ALL para buscar todos independente de status
      const result = await ProfissionalService.getProfissionais({
        ...params,
        status: params.status || 'ALL'
      });
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar todos os profissionais' });
      }
    }
  }

  /**
   * [ADMIN] Atualiza o status de um profissional
   */
  async updateProfissionalStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Validar se o ID é um número
      const profissionalId = parseInt(id);
      if (isNaN(profissionalId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      // Validar o status
      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use APPROVED, REJECTED ou PENDING.' });
      }
      
      const result = await ProfissionalService.updateProfissionalStatus(
        profissionalId, 
        status as 'APPROVED' | 'REJECTED' | 'PENDING'
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar status do profissional' });
      }
    }
  }

  /**
   * [ADMIN] Atualiza o destaque de um profissional
   */
  async updateProfissionalFeatured(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      
      // Validar se o ID é um número
      const profissionalId = parseInt(id);
      if (isNaN(profissionalId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      // Validar o featured
      if (typeof featured !== 'boolean') {
        return res.status(400).json({ error: 'Featured inválido. Use true ou false.' });
      }
      
      const result = await ProfissionalService.updateProfissionalFeatured(
        profissionalId, 
        featured
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao atualizar destaque do profissional' });
      }
    }
  }

  /**
   * [ADMIN] Exclui um profissional
   */
  async deleteProfissional(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Validar se o ID é um número
      const profissionalId = parseInt(id);
      if (isNaN(profissionalId)) {
        return res.status(400).json({ error: 'ID inválido. Formato numérico esperado.' });
      }
      
      const result = await ProfissionalService.deleteProfissional(
        profissionalId, 
        undefined, // userId não necessário para admin
        true // é admin
      );
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao deletar profissional' });
      }
    }
  }

  /**
   * Cria profissionais de exemplo para testes
   */
  async createProfissionaisExemplo(req: Request, res: Response) {
    try {
      // Array de profissionais de exemplo
      const profissionaisExemplo = [
        {
          name: 'Ana Silva', 
          ocupacao: 'Médica',
          descricao: 'Médica especialista em clínica geral com mais de 10 anos de experiência. Atendimento humanizado e focado no bem-estar do paciente.',
          foto: 'https://example.com/fotos/ana-silva.jpg',
          endereco: 'Rua da Saúde, 123, Centro',
          telefone: '(11) 99999-1111',
          estado: 'SP',
          cidade: 'São Paulo',
          email: 'contato@anasilva.med.br',
          website: 'https://anasilva.med.br',
          redes_sociais: {
            facebook: 'https://facebook.com/draanasilva',
            instagram: 'https://instagram.com/draanasilva',
            linkedin: 'https://linkedin.com/in/draanasilva'
          },
          disponibilidade: {
            segunda: '08:00 - 18:00',
            terca: '08:00 - 18:00',
            quarta: '08:00 - 18:00',
            quinta: '08:00 - 18:00',
            sexta: '08:00 - 16:00'
          },
          is_featured: true,
          avaliacao: 4.8,
          status: 'APPROVED' as 'APPROVED'
        },
        {
          name: 'Carlos Oliveira', 
          ocupacao: 'Advogado',
          descricao: 'Advogado especializado em direito civil e trabalhista. Atendimento personalizado para pessoas físicas e jurídicas.',
          foto: 'https://example.com/fotos/carlos-oliveira.jpg',
          endereco: 'Avenida Paulista, 1000, Sala 203',
          telefone: '(11) 98888-2222',
          estado: 'SP',
          cidade: 'São Paulo',
          email: 'carlos@oliveira.adv.br',
          website: 'https://oliveira.adv.br',
          redes_sociais: {
            facebook: 'https://facebook.com/carlosoliveira.adv',
            instagram: 'https://instagram.com/carlosoliveira.adv'
          },
          disponibilidade: {
            segunda: '09:00 - 17:00',
            terca: '09:00 - 17:00',
            quarta: '09:00 - 17:00',
            quinta: '09:00 - 17:00',
            sexta: '09:00 - 17:00'
          },
          is_featured: true,
          avaliacao: 4.6,
          status: 'APPROVED' as 'APPROVED'
        },
        {
          name: 'Mariana Souza', 
          ocupacao: 'Arquiteta',
          descricao: 'Arquiteta e urbanista com foco em projetos residenciais e comerciais sustentáveis. Transforma espaços em ambientes funcionais e aconchegantes.',
          foto: 'https://example.com/fotos/mariana-souza.jpg',
          endereco: 'Rua dos Arquitetos, 456, Jardins',
          telefone: '(11) 97777-3333',
          estado: 'SP',
          cidade: 'São Paulo',
          email: 'contato@marianasouza.arq.br',
          website: 'https://marianasouza.arq.br',
          redes_sociais: {
            facebook: 'https://facebook.com/marianasouza.arq',
            instagram: 'https://instagram.com/marianasouza.arq',
            pinterest: 'https://pinterest.com/marianasouza'
          },
          disponibilidade: {
            segunda: '10:00 - 18:00',
            terca: '10:00 - 18:00',
            quarta: '10:00 - 18:00',
            quinta: '10:00 - 18:00',
            sexta: '10:00 - 16:00',
            sabado: '10:00 - 14:00'
          },
          is_featured: false,
          avaliacao: 4.9,
          status: 'APPROVED' as 'APPROVED'
        },
        {
          name: 'Roberto Almeida', 
          ocupacao: 'Eletricista',
          descricao: 'Eletricista residencial e comercial com mais de 15 anos de experiência. Instalações, reparos e manutenção preventiva com segurança e qualidade.',
          foto: 'https://example.com/fotos/roberto-almeida.jpg',
          endereco: null,
          telefone: '(11) 94444-6666',
          estado: 'SP',
          cidade: 'São Paulo',
          email: 'roberto.eletricista@email.com',
          website: null,
          redes_sociais: {
            facebook: 'https://facebook.com/robertoeletricista',
            whatsapp: '5511944446666'
          },
          disponibilidade: {
            segunda: '08:00 - 18:00',
            terca: '08:00 - 18:00',
            quarta: '08:00 - 18:00',
            quinta: '08:00 - 18:00',
            sexta: '08:00 - 18:00',
            sabado: '08:00 - 12:00'
          },
          is_featured: false,
          avaliacao: 4.2,
          status: 'APPROVED' as 'APPROVED'
        },
        {
          name: 'Fernanda Lima', 
          ocupacao: 'Nutricionista',
          descricao: 'Nutricionista especializada em reeducação alimentar e emagrecimento saudável. Atendimento humanizado com planos alimentares personalizados.',
          foto: 'https://example.com/fotos/fernanda-lima.jpg',
          endereco: 'Avenida da Saúde, 321, Pinheiros',
          telefone: '(11) 93333-7777',
          estado: 'SP',
          cidade: 'São Paulo',
          email: 'fernanda@nutricao.com',
          website: 'https://fernandanutri.com.br',
          redes_sociais: {
            instagram: 'https://instagram.com/fernandanutri',
            facebook: 'https://facebook.com/fernandanutri'
          },
          disponibilidade: {
            segunda: '08:00 - 17:00',
            terca: '08:00 - 17:00',
            quarta: '08:00 - 17:00',
            quinta: '08:00 - 17:00',
            sexta: '08:00 - 15:00'
          },
          is_featured: true,
          avaliacao: 4.8,
          status: 'APPROVED' as 'APPROVED'
        }
      ];
      
      // Criar os profissionais
      const promises = profissionaisExemplo.map(profissional => {
        // Para testes, usamos um ID de usuário fixo ou null já que não é autenticado
        const userId = process.env.NODE_ENV === 'development' ? 'test-user-id' : null;
        return ProfissionalService.createProfissional(profissional, userId as any);
      });
      
      await Promise.all(promises);
      
      res.status(201).json({
        message: `${profissionaisExemplo.length} profissionais de exemplo criados com sucesso`,
        count: profissionaisExemplo.length
      });
    } catch (error: any) {
      console.error('Erro ao criar profissionais de exemplo:', error);
      
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ 
          error: 'Erro ao criar profissionais de exemplo', 
          message: error.message,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined 
        });
      }
    }
  }
} 