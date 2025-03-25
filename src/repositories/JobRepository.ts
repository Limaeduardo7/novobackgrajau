import { prisma } from '../database/prisma';
import { Job, JobCreateParams, JobListParams, JobStatus, JobUpdateParams, PaginatedResponse } from '../types/job.types';

export class JobRepository {
  /**
   * Lista vagas com filtros e paginação
   */
  async list({
    page,
    limit,
    status = JobStatus.APPROVED,
    featured,
    businessId,
    search,
    location,
    type
  }: JobListParams): Promise<PaginatedResponse<Job>> {
    // Construir a consulta com base nos filtros
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (featured !== undefined) {
      where.featured = featured;
    }
    
    if (businessId) {
      where.businessId = businessId;
    }
    
    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }
    
    if (type) {
      where.type = {
        contains: type,
        mode: 'insensitive'
      };
    }
    
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          tags: {
            has: search
          }
        }
      ];
    }
    
    // Adicionar verificação de expiração para vagas aprovadas
    if (status === JobStatus.APPROVED) {
      where.OR = where.OR || [];
      where.OR.push(
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      );
    }
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          business: {
            select: {
              id: true,
              name: true,
              logo: true,
              city: true,
              state: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.job.count({ where })
    ]);
    
    return {
      data: jobs as unknown as Job[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtém uma vaga pelo ID
   */
  async getById(id: string): Promise<Job | null> {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            description: true,
            website: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            userId: true
          }
        }
      }
    });
    
    return job as unknown as Job | null;
  }

  /**
   * Cria uma nova vaga
   */
  async create(data: JobCreateParams): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements || [],
        benefits: data.benefits || [],
        salary: data.salary,
        type: data.type,
        location: data.location,
        businessId: data.businessId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        tags: data.tags || [],
        status: JobStatus.PENDING, // Todas as vagas começam como pendentes
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });
    
    return job as unknown as Job;
  }

  /**
   * Atualiza uma vaga existente
   */
  async update(id: string, data: JobUpdateParams): Promise<Job> {
    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.requirements && { requirements: data.requirements }),
        ...(data.benefits && { benefits: data.benefits }),
        ...(data.salary && { salary: data.salary }),
        ...(data.type && { type: data.type }),
        ...(data.location && { location: data.location }),
        ...(data.expiresAt && { expiresAt: new Date(data.expiresAt) }),
        ...(data.tags && { tags: data.tags }),
        status: JobStatus.PENDING, // Retorna para pendente após edição
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });
    
    return job as unknown as Job;
  }

  /**
   * Exclui uma vaga
   */
  async delete(id: string): Promise<void> {
    await prisma.job.delete({
      where: { id }
    });
  }

  /**
   * Atualiza o status de uma vaga
   */
  async updateStatus(id: string, status: JobStatus): Promise<Job> {
    const job = await prisma.job.update({
      where: { id },
      data: { status }
    });
    
    return job as unknown as Job;
  }

  /**
   * Marca ou desmarca uma vaga como destaque
   */
  async toggleFeatured(id: string, featured: boolean): Promise<Job> {
    const job = await prisma.job.update({
      where: { id },
      data: { featured }
    });
    
    return job as unknown as Job;
  }

  /**
   * Obtém vagas em destaque
   */
  async getFeatured(limit: number): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.APPROVED,
        featured: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
            state: true
          }
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    return jobs as unknown as Job[];
  }

  /**
   * Incrementa o contador de visualizações
   */
  async incrementViews(id: string): Promise<void> {
    await prisma.job.update({
      where: { id },
      data: {
        views: {
          increment: 1
        }
      }
    });
  }

  /**
   * Incrementa o contador de aplicações
   */
  async incrementApplications(id: string): Promise<void> {
    await prisma.job.update({
      where: { id },
      data: {
        applications: {
          increment: 1
        }
      }
    });
  }

  /**
   * Obtém vagas de uma empresa específica
   */
  async getByBusiness(businessId: string, { page, limit, status }: { page: number; limit: number; status?: string }): Promise<PaginatedResponse<Job>> {
    const where: any = {
      businessId
    };
    
    if (status) {
      where.status = status;
    }
    
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.count({ where })
    ]);
    
    return {
      data: jobs as unknown as Job[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
} 