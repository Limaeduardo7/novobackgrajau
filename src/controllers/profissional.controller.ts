import { Request, Response } from 'express';
import ProfissionalService from '../services/profissional.factory';
import { AppError } from '../utils/AppError';
import { Profissional, ProfissionalParams } from '../types/profissional';

class ProfissionalController {
  /**
   * Lista profissionais com paginação e filtros
   */
  async getProfissionais(req: Request, res: Response) {
    try {
      const params: ProfissionalParams = {
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
      
      // Validar se o ID é um UUID válido
      if (!id) {
        return res.status(400).json({ error: 'ID inválido. UUID esperado.' });
      }
      
      const result = await ProfissionalService.getProfissionalById(id);
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
      // Extrair userId do objeto auth adicionado pelo middleware
      const userId = (req as any).auth?.userId;
      console.log('[PROFILE] Buscando perfil para userId:', userId);
      
      if (!userId) {
        console.log('[PROFILE] Tentativa de acesso sem userId');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      try {
        const result = await ProfissionalService.getProfissionalByUserId(userId);
        console.log('[PROFILE] Perfil encontrado:', result.data ? 'Sim' : 'Não');
        res.json(result);
      } catch (error: any) {
        if (error instanceof AppError && error.statusCode === 404) {
          return res.status(404).json({ 
            error: 'Perfil não encontrado',
            message: 'Você ainda não possui um perfil de profissional. Por favor, crie seu perfil primeiro.',
            code: 'PROFILE_NOT_FOUND'
          });
        }
        throw error;
      }
    } catch (error: any) {
      console.error('[PROFILE] Erro ao buscar perfil:', error);
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
      console.log('[CREATE] Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      // Extrair userId do objeto auth adicionado pelo middleware
      const userId = (req as any).auth?.userId;
      const user = (req as any).auth?.session?.user;
      
      console.log('[CREATE] Dados do usuário:', { userId, user });
      
      if (!userId) {
        console.log('[CREATE] Tentativa de criação sem userId');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Garantir que todos os campos obrigatórios estejam presentes
      const profissionalData = {
        nome: req.body.nome ? String(req.body.nome).trim() : '',
        ocupacao: req.body.ocupacao ? String(req.body.ocupacao).trim() : '',
        especialidades: Array.isArray(req.body.especialidades) ? req.body.especialidades : [],
        experiencia: req.body.experiencia || '',
        educacao: Array.isArray(req.body.educacao) ? req.body.educacao : [],
        certificacoes: Array.isArray(req.body.certificacoes) ? req.body.certificacoes : [],
        portfolio: Array.isArray(req.body.portfolio) ? req.body.portfolio : [],
        disponibilidade: req.body.disponibilidade || '',
        valor_hora: req.body.valor_hora ? Number(req.body.valor_hora) : null,
        sobre: req.body.sobre || '',
        foto: req.body.foto || null,
        telefone: req.body.telefone ? String(req.body.telefone).trim() : '',
        email: req.body.email || user?.email || '',
        website: req.body.website || null,
        endereco: req.body.endereco || null,
        estado: req.body.estado ? String(req.body.estado).trim() : '',
        cidade: req.body.cidade ? String(req.body.cidade).trim() : '',
        social_media: req.body.social_media || null,
        featured: false,
        status: 'PENDING' as const
      };
      
      // Validar campos obrigatórios
      const camposObrigatorios = {
        nome: 'Nome',
        ocupacao: 'Ocupação',
        estado: 'Estado',
        cidade: 'Cidade',
        email: 'Email'
      };
      
      for (const [campo, label] of Object.entries(camposObrigatorios)) {
        if (!profissionalData[campo as keyof typeof profissionalData]) {
          console.log(`[CREATE] Campo obrigatório ausente: ${campo}`);
          return res.status(400).json({ error: `${label} é obrigatório` });
        }
      }
      
      console.log('[CREATE] Dados validados, criando perfil...');
      const result = await ProfissionalService.createProfissional(profissionalData, userId);
      console.log('[CREATE] Perfil criado com sucesso');
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('[CREATE] Erro detalhado:', error);
      
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
      // Extrair userId do objeto auth adicionado pelo middleware
      const userId = (req as any).auth?.userId;
      console.log('[UPDATE] Atualizando perfil para userId:', userId);
      
      if (!userId) {
        console.log('[UPDATE] Tentativa de atualização sem userId');
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Buscar o profissional do usuário
      try {
        console.log('[UPDATE] Buscando perfil existente...');
        const { data: profissional } = await ProfissionalService.getProfissionalByUserId(userId);
        
        console.log('[UPDATE] Dados recebidos para atualização:', JSON.stringify(req.body, null, 2));
        
        // Atualizar o perfil
        const result = await ProfissionalService.updateProfissional(
          profissional.id, 
          req.body, 
          userId,
          false // não é admin
        );
        
        console.log('[UPDATE] Perfil atualizado com sucesso');
        res.json(result);
      } catch (error: any) {
        if (error instanceof AppError && error.statusCode === 404) {
          console.log('[UPDATE] Perfil não encontrado para atualização');
          return res.status(404).json({ error: 'Você não possui um perfil de profissional' });
        }
        throw error;
      }
    } catch (error: any) {
      console.error('[UPDATE] Erro ao atualizar perfil:', error);
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
   * [ADMIN] Lista todos os profissionais (com opção de filtragem)
   */
  async getAllProfissionais(req: Request, res: Response) {
    try {
      const params: ProfissionalParams = {
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
   * [ADMIN] Lista profissionais com status pendente
   */
  async getPendingProfissionais(req: Request, res: Response) {
    try {
      const params: ProfissionalParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        ocupacao: req.query.ocupacao as string | undefined,
        status: 'PENDING',
        sortBy: req.query.sortBy as string | undefined,
        order: (req.query.order as 'asc' | 'desc' | undefined) || 'desc'
      };

      const result = await ProfissionalService.getProfissionais(params);
      
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erro ao buscar profissionais pendentes' });
      }
    }
  }

  /**
   * [ADMIN] Atualiza o status de um profissional
   */
  async updateProfissionalStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;
      
      // Validar o ID
      if (!id) {
        return res.status(400).json({ error: 'ID inválido. UUID esperado.' });
      }
      
      // Validar o status
      if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use APPROVED, REJECTED ou PENDING.' });
      }
      
      const result = await ProfissionalService.updateProfissionalStatus(
        id, 
        status as 'APPROVED' | 'REJECTED' | 'PENDING',
        message
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
      
      // Validar o ID
      if (!id) {
        return res.status(400).json({ error: 'ID inválido. UUID esperado.' });
      }
      
      // Validar o featured
      if (typeof featured !== 'boolean') {
        return res.status(400).json({ error: 'Featured inválido. Use true ou false.' });
      }
      
      const result = await ProfissionalService.updateProfissionalFeatured(
        id, 
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
      
      // Validar o ID
      if (!id) {
        return res.status(400).json({ error: 'ID inválido. UUID esperado.' });
      }
      
      const result = await ProfissionalService.deleteProfissional(
        id, 
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
      // Criar exemplos de profissionais para testes
      const profissionaisExemplo = [
        {
          nome: 'Ana Silva',
          ocupacao: 'Médica',
          especialidades: ['Clínica Geral', 'Pediatria', 'Medicina Preventiva'],
          experiencia: 'Mais de 10 anos atuando em hospitais públicos e privados com foco em medicina familiar.',
          educacao: ['Graduação em Medicina - USP', 'Residência em Clínica Médica - Hospital das Clínicas', 'Especialização em Pediatria - Instituto da Criança'],
          certificacoes: ['CRM/SP 12345', 'Certificação em Primeiros Socorros'],
          portfolio: ['https://dranasilvaclinica.com.br/casos', 'https://dranasilvaclinica.com.br/publicacoes'],
          disponibilidade: 'Segunda a Sexta, 8h às 18h',
          valor_hora: 250.00,
          sobre: 'Médica dedicada com abordagem humanizada, focada no bem-estar integral dos pacientes. Trabalho com prevenção e tratamento personalizado.',
          foto: 'https://randomuser.me/api/portraits/women/1.jpg',
          telefone: '(11) 98765-4321',
          email: 'dra.anasilva@exemplo.com.br',
          website: 'https://dranasilvaclinica.com.br',
          endereco: 'Rua das Flores, 123, Conjunto 45',
          cidade: 'São Paulo',
          estado: 'SP',
          social_media: {
            instagram: '@dra.anasilva',
            linkedin: 'anasilvamedica',
            facebook: 'draanasilva'
          },
          status: 'APPROVED' as const,
          featured: true
        },
        {
          nome: 'Carlos Oliveira',
          ocupacao: 'Advogado',
          especialidades: ['Direito Civil', 'Direito do Trabalho', 'Direito do Consumidor'],
          experiencia: 'Mais de 15 anos de experiência em escritórios de grande porte e como assessor jurídico empresarial.',
          educacao: ['Graduação em Direito - PUC-SP', 'Especialização em Direito Civil - FGV', 'Mestrado em Direito do Trabalho - USP'],
          certificacoes: ['OAB/SP 54321', 'Especialista em Mediação e Arbitragem'],
          portfolio: ['https://oliveiralegal.com.br/casos/trabalhista', 'https://oliveiralegal.com.br/artigos'],
          disponibilidade: 'Segunda a Sexta, 9h às 18h',
          valor_hora: 300.00,
          sobre: 'Advogado com vasta experiência em questões civis e trabalhistas. Atendimento personalizado e abordagem estratégica para soluções jurídicas eficazes.',
          foto: 'https://randomuser.me/api/portraits/men/2.jpg',
          telefone: '(11) 91234-5678',
          email: 'carlos@oliveiralegal.com.br',
          website: 'https://oliveiralegal.com.br',
          endereco: 'Avenida Paulista, 1000, Sala 1520',
          cidade: 'São Paulo',
          estado: 'SP',
          social_media: {
            instagram: '@adv.carlos',
            linkedin: 'carlosoliveira_adv',
            facebook: 'advcarlosoliveira'
          },
          status: 'APPROVED' as const,
          featured: true
        },
        {
          nome: 'Mariana Souza',
          ocupacao: 'Arquiteta',
          especialidades: ['Arquitetura Residencial', 'Arquitetura Sustentável', 'Interiores'],
          experiencia: 'Mais de 8 anos desenvolvendo projetos residenciais e comerciais com foco em sustentabilidade.',
          educacao: ['Graduação em Arquitetura - Mackenzie', 'Pós-graduação em Arquitetura Sustentável - IED São Paulo'],
          certificacoes: ['CAU A12345-6', 'Certificação LEED Green Associate'],
          portfolio: ['https://marianasouza.arq.br/portfolio/residencial', 'https://marianasouza.arq.br/portfolio/comercial'],
          disponibilidade: 'Segunda a Sexta, 10h às 19h',
          valor_hora: 180.00,
          sobre: 'Arquiteta apaixonada por criar espaços harmoniosos e funcionais. Especialista em projetos sustentáveis que unem estética, conforto e responsabilidade ambiental.',
          foto: 'https://randomuser.me/api/portraits/women/3.jpg',
          telefone: '(11) 99876-5432',
          email: 'contato@marianasouza.arq.br',
          website: 'https://marianasouza.arq.br',
          endereco: 'Rua Augusta, 789, Conjunto 32',
          cidade: 'São Paulo',
          estado: 'SP',
          social_media: {
            instagram: '@mariana.arq',
            facebook: 'marianasouzaarquitetura'
          },
          status: 'APPROVED' as const,
          featured: true
        },
        {
          nome: 'Roberto Almeida',
          ocupacao: 'Eletricista',
          especialidades: ['Instalações Residenciais', 'Instalações Comerciais', 'Manutenção Preventiva'],
          experiencia: 'Mais de 20 anos trabalhando com instalações elétricas de todos os portes.',
          educacao: ['Técnico em Eletrotécnica - SENAI', 'Curso de NR-10 - Segurança em Instalações Elétricas'],
          certificacoes: ['Certificação NR-10', 'Credenciado pela ENEL'],
          portfolio: ['https://eletricistaroberto.com.br/projetos'],
          disponibilidade: 'Todos os dias, 7h às 21h',
          valor_hora: 80.00,
          sobre: 'Eletricista com vasta experiência em instalações e manutenções. Trabalho com segurança e qualidade, priorizando a satisfação do cliente e soluções duradouras.',
          foto: 'https://randomuser.me/api/portraits/men/4.jpg',
          telefone: '(11) 97654-3210',
          email: 'roberto@eletricistaroberto.com.br',
          website: 'https://eletricistaroberto.com.br',
          endereco: 'Rua dos Eletricistas, 456',
          cidade: 'São Paulo',
          estado: 'SP',
          social_media: {
            instagram: '@roberto.eletricista',
            facebook: 'robertoeletricista'
          },
          status: 'APPROVED' as const,
          featured: false
        },
        {
          nome: 'Fernanda Lima',
          ocupacao: 'Nutricionista',
          especialidades: ['Nutrição Clínica', 'Nutrição Esportiva', 'Reeducação Alimentar'],
          experiencia: 'Mais de 6 anos atendendo em consultório próprio e assessorando atletas amadores e profissionais.',
          educacao: ['Graduação em Nutrição - UNIFESP', 'Especialização em Nutrição Esportiva - USP'],
          certificacoes: ['CRN-3 12345', 'Especialista em Nutrição Funcional'],
          portfolio: ['https://fernandalima.nutri.br/casos-de-sucesso', 'https://fernandalima.nutri.br/artigos'],
          disponibilidade: 'Segunda a Sexta, 8h às 20h',
          valor_hora: 150.00,
          sobre: 'Nutricionista especializada em planos alimentares personalizados. Atendo com foco na saúde integral e bem-estar, respeitando a individualidade e os objetivos de cada pessoa.',
          foto: 'https://randomuser.me/api/portraits/women/5.jpg',
          telefone: '(11) 95432-1098',
          email: 'fernanda@nutricionista.com.br',
          website: 'https://fernandalima.nutri.br',
          endereco: 'Avenida Brasil, 500, Sala 45',
          cidade: 'São Paulo',
          estado: 'SP',
          social_media: {
            instagram: '@fernanda.nutri',
            youtube: 'fernandalimanutricionista',
            facebook: 'nutrifernandalima'
          },
          status: 'APPROVED' as const,
          featured: false
        }
      ];

      // Criar profissionais no banco de dados
      const promessasCriacao = profissionaisExemplo.map(profissional => {
        return ProfissionalService.createProfissional(profissional);
      });

      await Promise.all(promessasCriacao);

      return res.status(201).json({
        success: true,
        message: 'Profissionais de exemplo criados com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao criar profissionais de exemplo:', error);
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro interno ao criar profissionais de exemplo'
      });
    }
  }
}

export default new ProfissionalController(); 