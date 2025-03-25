import { EmpresaSupabaseService } from './empresa.supabase.service';

/**
 * Factory para decidir qual implementação do serviço de empresas usar
 * Atualmente, usa apenas a implementação Supabase
 */
const EmpresaService = new EmpresaSupabaseService();

export default EmpresaService; 