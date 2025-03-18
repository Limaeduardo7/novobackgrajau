import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE || '';

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE são obrigatórios');
  process.exit(1);
}

// Criar cliente Supabase com a service role key
const supabase = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase; 