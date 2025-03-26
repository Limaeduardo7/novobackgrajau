import { Database } from './database.types';

export type JobApplication = Database['public']['Tables']['job_applications']['Row'];
export type JobApplicationInsert = Database['public']['Tables']['job_applications']['Insert'];
export type JobApplicationUpdate = Database['public']['Tables']['job_applications']['Update'];

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface JobApplicationCreateParams {
  jobId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  salaryExpectation?: number;
  availabilityDate?: Date;
  experienceYears?: number;
  skills?: string[];
  additionalInfo?: Record<string, any>;
}

export interface JobApplicationUpdateParams {
  status?: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  salaryExpectation?: number;
  availabilityDate?: Date;
  experienceYears?: number;
  skills?: string[];
  additionalInfo?: Record<string, any>;
}

export interface JobApplicationListParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  jobId?: string;
  professionalId?: string;
} 