/**
 * Configurações de ambiente para a aplicação
 */

export const ENV = {
  // Ambiente da aplicação (development, production, test)
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Porta da aplicação
  PORT: process.env.PORT || 3000,
  
  // Use serviços mock no ambiente de desenvolvimento
  USE_MOCK_SERVICES: process.env.USE_MOCK_SERVICES === 'true' || false,
  
  // Configurações de banco de dados
  DATABASE: {
    USE_LOCAL: process.env.DATABASE_USE_LOCAL === 'true' || false,
    URL_LOCAL: process.env.DATABASE_URL_LOCAL || '',
  },
  
  // Outras configurações da aplicação
  APP: {
    NAME: 'Grajau API',
    VERSION: '1.0.0',
  },
  
  // Informações de debug
  DEBUG: {
    LOG_QUERIES: process.env.LOG_QUERIES === 'true' || false,
  }
};

// Utilitários de configuração
export const isDevelopment = ENV.NODE_ENV === 'development';
export const isProduction = ENV.NODE_ENV === 'production';
export const isTest = ENV.NODE_ENV === 'test';

// Flags de feature
export const FEATURES = {
  USE_MOCK_IN_DEV: ENV.USE_MOCK_SERVICES && isDevelopment,
};

export default ENV; 