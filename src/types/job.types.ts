export enum JobStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum BusinessStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  salary: string;
  type: string;
  location: string;
  status: JobStatus;
  featured: boolean;
  businessId: string;
  business?: Business;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  views: number;
  applications: number;
  tags: string[];
}

export interface Business {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  status: BusinessStatus;
  userId: string;
}

export interface JobListParams {
  page: number;
  limit: number;
  status?: string;
  featured?: boolean;
  businessId?: string;
  search?: string;
  location?: string;
  type?: string;
}

export interface JobCreateParams {
  title: string;
  description: string;
  requirements?: string[];
  benefits?: string[];
  salary: string;
  type: string;
  location: string;
  businessId: string;
  expiresAt?: string;
  tags?: string[];
  userId: string;
}

export interface JobUpdateParams {
  title?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  salary?: string;
  type?: string;
  location?: string;
  expiresAt?: string;
  tags?: string[];
  userId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
} 