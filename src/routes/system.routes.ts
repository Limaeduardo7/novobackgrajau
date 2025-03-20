import express from 'express';
import { ENV, FEATURES } from '../config/environment';

const router = express.Router();

/**
 * Rota para verificar o status do sistema
 * GET /api/system/status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'online',
    environment: ENV.NODE_ENV,
    version: ENV.APP.VERSION,
    timestamp: new Date().toISOString()
  });
});

/**
 * Rota para verificar a configuração do sistema
 * GET /api/system/config
 */
router.get('/config', (req, res) => {
  // Retorna informações sobre o ambiente e configurações
  // Útil para debug, mas não expõe credenciais
  const config = {
    environment: ENV.NODE_ENV,
    isProduction: ENV.NODE_ENV === 'production',
    isDevelopment: ENV.NODE_ENV === 'development',
    isTest: ENV.NODE_ENV === 'test',
    
    database: {
      usingMock: FEATURES.USE_MOCK_IN_DEV,
      usingLocal: ENV.DATABASE.USE_LOCAL
    },
    
    features: {
      mockEnabled: FEATURES.USE_MOCK_IN_DEV
    },
    
    app: {
      name: ENV.APP.NAME,
      version: ENV.APP.VERSION,
    }
  };
  
  res.json(config);
});

/**
 * Rota para verificar a conexão com o banco de dados
 * GET /api/system/db-status
 */
router.get('/db-status', async (req, res) => {
  if (FEATURES.USE_MOCK_IN_DEV) {
    return res.json({
      status: 'mock',
      connected: true,
      message: 'Usando serviço de mock. Banco de dados não é acessado.'
    });
  }
  
  try {
    // Tenta uma consulta simples para verificar se o banco está conectado
    // Isso pode ser ajustado conforme a implementação específica
    const prisma = require('../lib/prisma').default;
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'connected',
      connected: true,
      message: 'Conexão com o banco de dados estabelecida com sucesso'
    });
  } catch (error: any) {
    res.json({
      status: 'error',
      connected: false,
      message: error.message || 'Erro ao conectar ao banco de dados',
      error: ENV.NODE_ENV === 'development' ? error.message : 'Erro ao conectar'
    });
  }
});

export default router; 