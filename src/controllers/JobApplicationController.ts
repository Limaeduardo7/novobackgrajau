import { Request, Response } from 'express';
import { JobApplicationService } from '../services/JobApplicationService';
import { AppError } from '../errors/AppError';
import { ApplicationStatus } from '../types/job-application.types';

export class JobApplicationController {
  private jobApplicationService: JobApplicationService;

  constructor() {
    this.jobApplicationService = new JobApplicationService();
  }

  /**
   * Lista candidaturas com filtros
   */
  async list(req: Request, res: Response): Promise<Response> {
    try {
      const { 
        page = 1, 
        limit = 10, 
        status,
        jobId,
        professionalId 
      } = req.query;

      const applications = await this.jobApplicationService.list({
        page: Number(page),
        limit: Number(limit),
        status: status as ApplicationStatus,
        jobId: jobId as string,
        professionalId: professionalId as string
      });

      return res.json(applications);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao listar candidaturas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Obtém uma candidatura por ID
   */
  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const application = await this.jobApplicationService.getById(id);
      return res.json(application);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao obter candidatura:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Cria uma nova candidatura
   */
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const {
        jobId,
        coverLetter,
        resumeUrl,
        portfolioUrl,
        salaryExpectation,
        availabilityDate,
        experienceYears,
        skills,
        additionalInfo
      } = req.body;

      const application = await this.jobApplicationService.create({
        jobId,
        coverLetter,
        resumeUrl,
        portfolioUrl,
        salaryExpectation,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : undefined,
        experienceYears,
        skills,
        additionalInfo
      }, userId);

      return res.status(201).json(application);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao criar candidatura:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Atualiza uma candidatura
   */
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const {
        status,
        coverLetter,
        resumeUrl,
        portfolioUrl,
        salaryExpectation,
        availabilityDate,
        experienceYears,
        skills,
        additionalInfo
      } = req.body;

      const application = await this.jobApplicationService.update(id, {
        status,
        coverLetter,
        resumeUrl,
        portfolioUrl,
        salaryExpectation,
        availabilityDate: availabilityDate ? new Date(availabilityDate) : undefined,
        experienceYears,
        skills,
        additionalInfo
      }, userId);

      return res.json(application);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao atualizar candidatura:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /**
   * Exclui uma candidatura
   */
  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const userId = (req as any).auth?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      await this.jobApplicationService.delete(id, userId);
      
      return res.status(204).send();
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao excluir candidatura:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
} 