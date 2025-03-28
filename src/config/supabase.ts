import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: SUPABASE_URL e SUPABASE_KEY são obrigatórios');
  process.exit(1);
}

// Criar cliente Supabase com configuração simplificada
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 