/**
 * Cliente Supabase para acesso ao banco de dados
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Garantir que as variáveis de ambiente estão carregadas
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias');
  process.exit(1);
}

// Criar cliente Supabase com tipagem
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Helper para lidar com erros do Supabase de forma consistente
export const handleSupabaseError = (error: any): never => {
  console.error('Erro Supabase:', error);
  
  // Se o erro for do Supabase, ele terá um código e uma mensagem
  if (error?.code && error?.message) {
    throw new Error(`Erro ${error.code}: ${error.message}`);
  }
  
  // Caso contrário, apenas repassar o erro
  throw error;
}; 