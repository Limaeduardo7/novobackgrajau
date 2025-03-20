// Configuração do banco de dados para diferentes ambientes
export const getDatabaseUrl = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // URL do Supabase (produção)
  const supabaseUrl = "postgresql://postgres:%23Anunciar123@fqueaxdcuyrattmadkxx.supabase.co:5432/postgres?schema=public&keepalives=1&keepalives_idle=120&keepalives_interval=30&keepalives_count=15";
  
  // URL local para desenvolvimento (substituir com seu PostgreSQL local se disponível)
  const localUrl = process.env.DATABASE_URL_LOCAL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";
  
  // Use URL local em desenvolvimento se DATABASE_USE_LOCAL for definido como 'true'
  if (isDevelopment && process.env.DATABASE_USE_LOCAL === 'true') {
    console.log('Usando banco de dados local para desenvolvimento');
    return localUrl;
  }
  
  console.log('Usando banco de dados Supabase');
  return supabaseUrl;
};

// Configuração para lidar com falhas de conexão graciosamente
export const handleConnectionError = (error: any) => {
  console.error('Erro ao conectar ao banco de dados:', error.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('Erro de conexão em ambiente de desenvolvimento. Isso pode ser esperado.');
    console.warn('Para desenvolvimento local, considere:');
    console.warn('1. Configurar um PostgreSQL local');
    console.warn('2. Definir DATABASE_USE_LOCAL=true no seu .env');
    console.warn('3. Usar consultas mockadas para testes sem banco de dados');
  } else {
    console.error('ERRO CRÍTICO: Falha na conexão com o banco em produção!');
  }
}; 