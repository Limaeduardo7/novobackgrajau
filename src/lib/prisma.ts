import { PrismaClient } from '@prisma/client';

// URL do banco de dados hardcoded para fins de debug e resolver problema de conexão
const DATABASE_URL = "postgresql://postgres:%23Anunciar123@fqueaxdcuyrattmadkxx.supabase.co:6543/postgres?schema=public";
// Sanitizar a URL para não exibir a senha nos logs
const sanitizedUrl = DATABASE_URL.replace(/:([^:@]+)@/, ':***@');

console.log('Iniciando conexão com banco de dados (hardcoded):', sanitizedUrl);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

export default prisma; 