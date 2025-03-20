// Teste de conexão com o banco de dados
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const dbUrl = process.env.DATABASE_URL || '';
const sanitizedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@');
console.log('Tentando conectar ao banco de dados:', sanitizedUrl);

const prisma = new PrismaClient();

async function testConnection() {
  try {
    // Tentar uma consulta simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Conexão bem-sucedida!', result);
    
    // Testar acesso às tabelas
    const categories = await prisma.category.findMany({ take: 1 });
    console.log('Categorias encontradas:', categories.length);
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(result => {
    if (result.success) {
      console.log('Teste concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('Teste falhou!');
      process.exit(1);
    }
  })
  .catch(e => {
    console.error('Erro não tratado:', e);
    process.exit(1);
  }); 