/**
 * Configuração de conexão com banco de dados
 */

/**
 * Obtém a URL do banco de dados com base no ambiente
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL não está definida nas variáveis de ambiente');
  }
  return url;
}

/**
 * Trata erros de conexão com o banco de dados
 */
export function handleConnectionError(error: any): void {
  console.error('Erro ao conectar com banco de dados:', error.message);
  
  // Log detalhado para diagnóstico
  if (error.code) {
    console.error(`Código do erro: ${error.code}`);
  }
  
  if (error.meta && error.meta.details) {
    console.error(`Detalhes: ${error.meta.details}`);
  }
  
  // Tratamento específico por tipo de erro
  if (error.message.includes('connect ECONNREFUSED')) {
    console.error('O banco de dados parece estar offline ou inacessível. Verifique se o serviço está ativo.');
  } else if (error.message.includes('authentication failed')) {
    console.error('Falha na autenticação. Verifique as credenciais do banco de dados.');
  } else if (error.message.includes('database') && error.message.includes('does not exist')) {
    console.error('O banco de dados especificado não existe. Verifique o nome do banco na URL de conexão.');
  }
} 