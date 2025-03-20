import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, handleConnectionError } from '../config/database';

// Obter a URL do banco de dados baseada no ambiente
const DATABASE_URL = getDatabaseUrl();
// Sanitizar a URL para não exibir a senha nos logs
const sanitizedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':***@');

console.log('Iniciando conexão com banco de dados:', sanitizedUrl);

// Criar PrismaClient com tratamento de erro
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

// Verificar conexão (opcional, apenas para diagnóstico)
prisma.$connect()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso.');
  })
  .catch(error => {
    handleConnectionError(error);
  });

// Lidar com erros não tratados de consultas posteriores
// @ts-ignore - Ignorando erros de tipo no manipulador de eventos
prisma.$on('query', (e: any) => {
  if (e && e.duration && e.duration > 1000) {
    console.warn(`Query lenta (${e.duration}ms):`, e.query || 'Consulta não disponível');
  }
});

process.on('beforeExit', () => {
  prisma.$disconnect().catch(console.error);
});

export default prisma; 