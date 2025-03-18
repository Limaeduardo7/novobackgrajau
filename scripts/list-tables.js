const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase
const supabaseUrl = 'https://fqueaxdcuyrattmadkxx.supabase.co';
// Usando a service role key para acesso completo ao banco
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxdWVheGRjdXlyYXR0bWFka3h4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxMTMxODgwMCwiZXhwIjoyMDI2ODk0ODAwfQ.jYcCXJqiZqbA9s-F9E7Ds91DGDZ0Zfg4DjH0QC34Q5g';

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseKey);

// Função para listar as tabelas
async function listTables() {
  try {
    // Consulta SQL para listar as tabelas do esquema public
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'like', 'pg_%');
    
    if (error) {
      console.error('Erro ao listar tabelas:', error);
      return;
    }
    
    console.log('Tabelas no banco de dados:');
    console.log(data);
  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Função alternativa para listar tabelas via SQL bruto
async function listTablesWithRawSQL() {
  try {
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Erro ao executar consulta SQL bruta:', error);
      
      // Tentar uma abordagem diferente
      console.log('Tentando abordagem alternativa...');
      
      const { data: altData, error: altError } = await supabase
        .from('pg_catalog.pg_tables')
        .select('schemaname, tablename')
        .eq('schemaname', 'public');
        
      if (altError) {
        console.error('Erro na abordagem alternativa:', altError);
        return;
      }
      
      console.log('Resultado da abordagem alternativa:');
      console.log(altData);
      return;
    }
    
    console.log('Tabelas via SQL bruto:');
    console.log(data);
  } catch (error) {
    console.error('Erro inesperado na SQL bruta:', error);
  }
}

// Executar ambas as funções
(async () => {
  console.log('Tentando listar tabelas:');
  await listTables();
  
  console.log('\nTentando listar tabelas via SQL bruto:');
  await listTablesWithRawSQL();
})(); 