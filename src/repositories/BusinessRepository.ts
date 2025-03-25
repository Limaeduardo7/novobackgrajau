import { prisma } from '../database/prisma';
import { Business, BusinessStatus } from '../types/job.types';

export class BusinessRepository {
  /**
   * Obtém uma empresa pelo ID
   */
  async getById(id: string): Promise<Business | null> {
    const business = await prisma.business.findUnique({
      where: { id }
    });
    
    return business as unknown as Business | null;
  }
} 