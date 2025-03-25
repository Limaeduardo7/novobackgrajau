import { AppError } from '../utils/AppError';
import { JobRepository } from '../repositories/JobRepository';
import { BusinessRepository } from '../repositories/BusinessRepository';
import { Job, JobCreateParams, JobListParams, JobStatus, JobUpdateParams, PaginatedResponse } from '../types/job.types';

export class JobService {
  private jobRepository: JobRepository;
  private businessRepository: BusinessRepository;

  constructor() {
    this.jobRepository = new JobRepository();
    this.businessRepository = new BusinessRepository();
  }

  /**
   * Lista vagas com filtros e paginação
   */
  async list(params: JobListParams): Promise<PaginatedResponse<Job>> {
    return this.jobRepository.list(params);
  }

  /**
   * Obtém uma vaga pelo ID
   */
  async getById(id: string): Promise<Job> {
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    return job;
  }

  /**
   * Cria uma nova vaga
   */
  async create(data: JobCreateParams): Promise<Job> {
    // Verificar se a empresa existe
    const business = await this.businessRepository.getById(data.businessId);
    
    if (!business) {
      throw new AppError(404, 'Empresa não encontrada');
    }
    
    // Verificar se o usuário é dono da empresa ou é admin
    if (business.userId !== data.userId && !await this.isUserAdmin(data.userId)) {
      throw new AppError(403, 'Você não tem permissão para criar vagas para esta empresa');
    }
    
    return this.jobRepository.create(data);
  }

  /**
   * Atualiza uma vaga existente
   */
  async update(id: string, data: JobUpdateParams): Promise<Job> {
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    // Verificar se o usuário é dono da empresa ou é admin
    const business = await this.businessRepository.getById(job.businessId);
    
    if (!business) {
      throw new AppError(404, 'Empresa não encontrada');
    }
    
    if (business.userId !== data.userId && !await this.isUserAdmin(data.userId)) {
      throw new AppError(403, 'Você não tem permissão para atualizar esta vaga');
    }
    
    return this.jobRepository.update(id, data);
  }

  /**
   * Exclui uma vaga
   */
  async delete(id: string, userId: string): Promise<void> {
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    // Verificar se o usuário é dono da empresa ou é admin
    const business = await this.businessRepository.getById(job.businessId);
    
    if (!business) {
      throw new AppError(404, 'Empresa não encontrada');
    }
    
    if (business.userId !== userId && !await this.isUserAdmin(userId)) {
      throw new AppError(403, 'Você não tem permissão para excluir esta vaga');
    }
    
    await this.jobRepository.delete(id);
  }

  /**
   * Atualiza o status de uma vaga (apenas admin)
   */
  async updateStatus(id: string, status: string, userId: string): Promise<Job> {
    // Verificar se o usuário é admin
    if (!await this.isUserAdmin(userId)) {
      throw new AppError(403, 'Apenas administradores podem alterar o status de vagas');
    }
    
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    if (!Object.values(JobStatus).includes(status as JobStatus)) {
      throw new AppError(400, 'Status inválido');
    }
    
    return this.jobRepository.updateStatus(id, status as JobStatus);
  }

  /**
   * Marca ou desmarca uma vaga como destaque (apenas admin)
   */
  async toggleFeatured(id: string, featured: boolean, userId: string): Promise<Job> {
    // Verificar se o usuário é admin
    if (!await this.isUserAdmin(userId)) {
      throw new AppError(403, 'Apenas administradores podem destacar vagas');
    }
    
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    return this.jobRepository.toggleFeatured(id, featured);
  }

  /**
   * Obtém vagas em destaque
   */
  async getFeatured(limit: number): Promise<Job[]> {
    return this.jobRepository.getFeatured(limit);
  }

  /**
   * Incrementa o contador de visualizações
   */
  async incrementViews(id: string): Promise<void> {
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    await this.jobRepository.incrementViews(id);
  }

  /**
   * Incrementa o contador de aplicações
   */
  async incrementApplications(id: string): Promise<void> {
    const job = await this.jobRepository.getById(id);
    
    if (!job) {
      throw new AppError(404, 'Vaga não encontrada');
    }
    
    await this.jobRepository.incrementApplications(id);
  }

  /**
   * Obtém vagas de uma empresa específica
   */
  async getByBusiness(
    businessId: string, 
    params: { page: number; limit: number; status?: string }
  ): Promise<PaginatedResponse<Job>> {
    const business = await this.businessRepository.getById(businessId);
    
    if (!business) {
      throw new AppError(404, 'Empresa não encontrada');
    }
    
    return this.jobRepository.getByBusiness(businessId, params);
  }

  /**
   * Verifica se o usuário é um administrador
   * @private
   */
  private async isUserAdmin(userId: string): Promise<boolean> {
    try {
      // TODO: Implementar verificação real com base no sistema de autenticação
      // Esta é apenas uma implementação de exemplo que deve ser substituída
      
      // Exemplo: verificar papel do usuário no banco de dados
      // const user = await prisma.user.findUnique({ where: { id: userId } });
      // return user?.role === 'ADMIN';
      
      // Usuários hardcoded para teste
      const adminUserIds = ['admin-user-id-1', 'admin-user-id-2'];
      return adminUserIds.includes(userId);
    } catch (error) {
      console.error('Erro ao verificar permissões de administrador:', error);
      return false;
    }
  }
} 