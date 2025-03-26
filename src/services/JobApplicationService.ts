import { AppError } from '../errors/AppError';
import { JobApplicationRepository } from '../repositories/JobApplicationRepository';
import { JobRepository } from '../repositories/JobRepository';
import { ProfissionalService } from './profissional.service';
import { PaginatedResponse } from '../types/common';
import { 
  JobApplication, 
  JobApplicationCreateParams, 
  JobApplicationListParams, 
  JobApplicationUpdateParams 
} from '../types/job-application.types';

export class JobApplicationService {
  private jobApplicationRepository: JobApplicationRepository;
  private jobRepository: JobRepository;

  constructor() {
    this.jobApplicationRepository = new JobApplicationRepository();
    this.jobRepository = new JobRepository();
  }

  /**
   * Lista candidaturas com filtros
   */
  async list(params: JobApplicationListParams): Promise<PaginatedResponse<JobApplication>> {
    return this.jobApplicationRepository.list(params);
  }

  /**
   * Obtém uma candidatura por ID
   */
  async getById(id: string): Promise<JobApplication> {
    const application = await this.jobApplicationRepository.getById(id);
    
    if (!application) {
      throw new AppError(404, 'Candidatura não encontrada');
    }

    return application;
  }

  /**
   * Cria uma nova candidatura
   */
  async create(data: JobApplicationCreateParams, userId: string): Promise<JobApplication> {
    // Verificar se a vaga existe
    const job = await this.jobRepository.getById(data.jobId);
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }

    // Buscar o ID do profissional pelo userId
    const professional = await ProfissionalService.getProfissionalByUserId(userId);
    if (!professional) {
      throw new AppError(404, 'Perfil profissional não encontrado');
    }

    // Verificar se já existe uma candidatura ativa para esta vaga
    const existingApplications = await this.jobApplicationRepository.list({
      jobId: data.jobId,
      professionalId: professional.id,
      status: 'PENDING'
    });

    if (existingApplications.data.length > 0) {
      throw new AppError(400, 'Você já possui uma candidatura ativa para esta vaga');
    }

    // Criar a candidatura
    const application = await this.jobApplicationRepository.create({
      job_id: data.jobId,
      professional_id: professional.id,
      cover_letter: data.coverLetter,
      resume_url: data.resumeUrl,
      portfolio_url: data.portfolioUrl,
      salary_expectation: data.salaryExpectation,
      availability_date: data.availabilityDate?.toISOString(),
      experience_years: data.experienceYears,
      skills: data.skills,
      additional_info: data.additionalInfo,
      created_by: userId,
      updated_by: userId
    });

    return application;
  }

  /**
   * Atualiza uma candidatura
   */
  async update(id: string, data: JobApplicationUpdateParams, userId: string): Promise<JobApplication> {
    const application = await this.getById(id);

    // Verificar se o usuário é o dono da candidatura ou é admin
    const professional = await ProfissionalService.getProfissionalByUserId(userId);
    if (!professional || (professional.id !== application.professional_id && !this.isAdmin(userId))) {
      throw new AppError(403, 'Você não tem permissão para atualizar esta candidatura');
    }

    return this.jobApplicationRepository.update(id, {
      ...data,
      updated_by: userId
    });
  }

  /**
   * Exclui uma candidatura
   */
  async delete(id: string, userId: string): Promise<void> {
    const application = await this.getById(id);

    // Verificar se o usuário é o dono da candidatura ou é admin
    const professional = await ProfissionalService.getProfissionalByUserId(userId);
    if (!professional || (professional.id !== application.professional_id && !this.isAdmin(userId))) {
      throw new AppError(403, 'Você não tem permissão para excluir esta candidatura');
    }

    await this.jobApplicationRepository.delete(id);
  }

  /**
   * Verifica se um usuário é admin
   */
  private isAdmin(userId: string): boolean {
    // Implementar lógica de verificação de admin
    return false;
  }
} 