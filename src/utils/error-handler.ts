import { PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../errors/AppError';

/**
 * Manipula erros do Supabase e converte para AppError
 */
export function handleSupabaseError(error: PostgrestError): never {
  console.error('Erro do Supabase:', error);
  
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  
  if (error.code === 'PGRST116') {
    statusCode = 404;
    message = 'Recurso não encontrado';
  } else if (error.code === 'PGRST109') {
    statusCode = 400;
    message = 'Dados inválidos';
  } else if (error.code === '23505') {
    statusCode = 409;
    message = 'Registro duplicado';
  }
  
  throw new AppError(statusCode, message);
} 