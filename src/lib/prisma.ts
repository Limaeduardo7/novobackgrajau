import { PrismaClient } from '@prisma/client';

// Imprimir a URL do banco de dados para debug (sem senha)
const dbUrl = process.env.DATABASE_URL || '';
const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('Iniciando conexão com banco de dados:', sanitizedUrl);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export default prisma; 