// Teste de conexão usando o cliente Prisma modificado
const prisma = require('./dist/lib/prisma').default;

async function testConnection() {
  try {
    console.log('Tentando conectar ao banco de dados usando PrismaClient...');
    
    // Testar uma query simples
    const result = await prisma.$queryRaw`SELECT NOW() as time`;
    console.log('Conexão bem-sucedida!');
    console.log('Hora no servidor:', result[0].time);
    
    // Testar listar tabelas
    try {
      const categories = await prisma.category.findMany({ take: 3 });
      console.log(`Encontradas ${categories.length} categorias:`);
      categories.forEach(cat => console.log(` - ${cat.name} (${cat.id})`));
    } catch (err) {
      console.error('Erro ao buscar categorias:', err.message);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao conectar:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Teste de conexão concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('Teste de conexão falhou!');
      process.exit(1);
    }
  }); 