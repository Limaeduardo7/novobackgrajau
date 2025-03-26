import supabase from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  try {
    console.log('Iniciando migração...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'migrations', 'alter_profissionais_user_id.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar a migração usando SQL bruto
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Erro ao executar migração:', error);
      process.exit(1);
    }
    
    console.log('Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  }
}

runMigration(); 