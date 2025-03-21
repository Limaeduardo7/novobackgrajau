/**
 * Utilitário para realizar retentativas de operações do Prisma
 * que podem falhar devido a problemas de conexão temporários
 */
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`Tentativa ${attempt + 1}/${maxRetries} falhou: ${error.message}`);
      
      // Verifica se é um erro de conexão ou transação
      const isRetryableError = 
        error.code === 'P1001' || // Erro de conexão
        error.code === 'P1002' || // Timeout
        error.code === 'P1008' || // Erro de operação
        error.code === 'P1017';   // Erro de conexão perdida
      
      if (!isRetryableError) {
        throw error; // Se não for um erro que pode ser recuperado, propaga imediatamente
      }
      
      // Espera antes de tentar novamente, com exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
    }
  }
  
  // Se todas as tentativas falharem, lança o último erro
  throw lastError || new Error('Todas as tentativas falharam');
}

export default retry; 