import { Request, Response } from 'express';
import { JobService } from '../services/JobService';
import { AppError } from '../utils/AppError';
import { JobStatus } from '../types/job.types';

export class JobController {
  private jobService: JobService;

  constructor() {
    this.jobService = new JobService();
  }

  /**
   * Lista todas as vagas com paginação e filtros
   */
  async list(req: Request, res: Response): Promise<Response> {
    try {
      let { 
        page = 1, 
        limit = 10, 
        status = JobStatus.APPROVED, 
        featured,
        businessId,
        search,
        location,
        type 
      } = req.query;

      // Mapear status em português para o formato esperado pelo enum
      if (status === 'pendente') {
        status = JobStatus.PENDING;
      } else if (status === 'aprovado') {
        status = JobStatus.APPROVED;
      } else if (status === 'rejeitado') {
        status = JobStatus.REJECTED;
      }

      const jobs = await this.jobService.list({
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        featured: featured === 'true',
        businessId: businessId as string,
        search: search as string,
        location: location as string,
        type: type as string
      });

      return res.json(jobs);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao listar vagas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obtém uma vaga por ID
   */
  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const job = await this.jobService.getById(id);
      return res.json(job);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao obter vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cria uma nova vaga
   */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      console.log('[JOB] Dados recebidos na requisição:', JSON.stringify(req.body));
      
      // Buscar o ID do usuário do objeto auth que foi configurado pelo middleware
      const userId = (req as any).auth?.userId || (req as any).auth?.session?.user?.id;
      console.log('[JOB] ID do usuário autenticado:', userId);
      
      // Em ambiente de desenvolvimento, podemos permitir mesmo sem usuário
      if (!userId && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // No ambiente de desenvolvimento, usamos um ID padrão se não estiver presente
      const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
      console.log('[JOB] ID do usuário efetivo:', effectiveUserId);
      
      // Mapear campos em português para os nomes esperados em inglês
      const {
        // Campos em inglês (formato original)
        title,
        description,
        requirements,
        benefits,
        salary,
        type,
        location,
        businessId,
        expiresAt,
        tags,
        
        // Campos em português (formato alternativo)
        titulo,
        descricao,
        requisitos,
        beneficios,
        salario,
        tipo,
        localizacao,
        empresa,
        dataExpiracao,
        categorias,
        
        // Campo específico para ID da empresa (suporte adicional)
        empresaId
      } = req.body;

      // Mapeamento de campos para o formato esperado
      const mappedTitle = title || titulo;
      const mappedDescription = description || descricao;
      const mappedRequirements = requirements || (requisitos ? [requisitos] : undefined);
      const mappedBenefits = benefits || (beneficios ? [beneficios] : undefined);
      const mappedSalary = salary || salario;
      const mappedType = type || tipo;
      const mappedLocation = location || localizacao;
      const mappedBusinessId = businessId || empresaId || empresa;
      const mappedExpiresAt = expiresAt || dataExpiracao;
      const mappedTags = tags || categorias;

      console.log('[JOB] Dados mapeados:', {
        title: mappedTitle,
        description: mappedDescription,
        businessId: mappedBusinessId,
        type: mappedType,
        location: mappedLocation
      });

      // Verificar se temos um ID ou nome de empresa
      if (!mappedBusinessId) {
        console.log('[JOB] Erro: ID ou nome da empresa não fornecido');
        return res.status(400).json({ error: 'O ID ou nome da empresa é obrigatório' });
      }

      // Validar campos obrigatórios
      if (!mappedTitle) {
        console.log('[JOB] Erro: título não fornecido');
        return res.status(400).json({ error: 'O título da vaga é obrigatório' });
      }

      if (!mappedDescription) {
        console.log('[JOB] Erro: descrição não fornecida');
        return res.status(400).json({ error: 'A descrição da vaga é obrigatória' });
      }

      if (!mappedType) {
        console.log('[JOB] Erro: tipo não fornecido');
        return res.status(400).json({ error: 'O tipo da vaga é obrigatório' });
      }

      if (!mappedLocation) {
        console.log('[JOB] Erro: localização não fornecida');
        return res.status(400).json({ error: 'A localização da vaga é obrigatória' });
      }

      console.log('[JOB] Todos os campos validados, criando vaga...');
      const job = await this.jobService.create({
        title: mappedTitle,
        description: mappedDescription,
        requirements: mappedRequirements,
        benefits: mappedBenefits,
        salary: mappedSalary,
        type: mappedType,
        location: mappedLocation,
        businessId: mappedBusinessId.toString(),
        expiresAt: mappedExpiresAt,
        tags: mappedTags,
        userId: effectiveUserId
      });

      console.log('[JOB] Vaga criada com sucesso:', job.id);
      return res.status(201).json(job);
    } catch (error) {
      if (error instanceof AppError) {
        console.error('[JOB] AppError:', error.message, 'Status:', error.statusCode);
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('[JOB] Erro ao criar vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualiza uma vaga existente
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Buscar o ID do usuário do objeto auth que foi configurado pelo middleware
      const userId = (req as any).auth?.userId || (req as any).auth?.session?.user?.id;
      
      // Em ambiente de desenvolvimento, podemos permitir mesmo sem usuário
      if (!userId && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // No ambiente de desenvolvimento, usamos um ID padrão se não estiver presente
      const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
      
      const {
        title,
        description,
        requirements,
        benefits,
        salary,
        type,
        location,
        expiresAt,
        tags
      } = req.body;

      const job = await this.jobService.update(id, {
        title,
        description,
        requirements,
        benefits,
        salary,
        type,
        location,
        expiresAt,
        tags,
        userId: effectiveUserId
      });

      return res.json(job);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao atualizar vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Exclui uma vaga
   */
  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      // Buscar o ID do usuário do objeto auth que foi configurado pelo middleware
      const userId = (req as any).auth?.userId || (req as any).auth?.session?.user?.id;
      
      // Em ambiente de desenvolvimento, podemos permitir mesmo sem usuário
      if (!userId && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // No ambiente de desenvolvimento, usamos um ID padrão se não estiver presente
      const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
      
      await this.jobService.delete(id, effectiveUserId);
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao excluir vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualiza o status de uma vaga (apenas admin)
   */
  async updateStatus(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      // Buscar o ID do usuário do objeto auth que foi configurado pelo middleware
      const userId = (req as any).auth?.userId || (req as any).auth?.session?.user?.id;
      
      // Em ambiente de desenvolvimento, podemos permitir mesmo sem usuário
      if (!userId && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // No ambiente de desenvolvimento, usamos um ID padrão se não estiver presente
      const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
      
      const job = await this.jobService.updateStatus(id, status, effectiveUserId);
      
      return res.json(job);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao atualizar status da vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Marca ou desmarca uma vaga como destaque (apenas admin)
   */
  async toggleFeatured(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { featured } = req.body;
      // Buscar o ID do usuário do objeto auth que foi configurado pelo middleware
      const userId = (req as any).auth?.userId || (req as any).auth?.session?.user?.id;
      
      // Em ambiente de desenvolvimento, podemos permitir mesmo sem usuário
      if (!userId && process.env.NODE_ENV !== 'development') {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // No ambiente de desenvolvimento, usamos um ID padrão se não estiver presente
      const effectiveUserId = userId || '00000000-0000-0000-0000-000000000000';
      
      const job = await this.jobService.toggleFeatured(id, featured, effectiveUserId);
      
      return res.json(job);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao destacar vaga:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obtém vagas em destaque
   */
  async getFeatured(req: Request, res: Response): Promise<Response> {
    try {
      const { limit = 6 } = req.query;
      
      const jobs = await this.jobService.getFeatured(Number(limit));
      
      return res.json(jobs);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao obter vagas em destaque:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Incrementa visualizações de uma vaga
   */
  async incrementViews(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      await this.jobService.incrementViews(id);
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao incrementar visualizações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Incrementa aplicações para uma vaga
   */
  async incrementApplications(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      
      await this.jobService.incrementApplications(id);
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao incrementar aplicações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

  /**
   * Obtém vagas por empresa
   */
  async getByBusiness(req: Request, res: Response): Promise<Response> {
    try {
      const { businessId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
      const jobs = await this.jobService.getByBusiness(
        businessId,
        {
          page: Number(page),
          limit: Number(limit),
          status: status as string
        }
      );
      
      return res.json(jobs);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao obter vagas da empresa:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
} 