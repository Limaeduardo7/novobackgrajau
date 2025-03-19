/**
 * Script para corrigir registros com categoryId nulo no banco de dados
 * 
 * Este script faz duas coisas:
 * 1. Cria uma categoria padrão se ela não existir
 * 2. Atualiza todos os posts com categoryId nulo para usar a categoria padrão
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definir o nome da categoria padrão
const DEFAULT_CATEGORY_NAME = 'Geral';
const DEFAULT_CATEGORY_SLUG = 'geral';

async function main() {
  console.log('Iniciando correção de posts com categoryId nulo...');
  
  try {
    // 1. Verificar se a categoria padrão já existe
    let defaultCategory = await prisma.category.findFirst({
      where: {
        name: DEFAULT_CATEGORY_NAME
      }
    });

    // 2. Criar a categoria padrão se ela não existir
    if (!defaultCategory) {
      console.log('Criando categoria padrão...');
      defaultCategory = await prisma.category.create({
        data: {
          name: DEFAULT_CATEGORY_NAME,
          slug: DEFAULT_CATEGORY_SLUG
        }
      });
      console.log(`Categoria padrão criada com ID: ${defaultCategory.id}`);
    } else {
      console.log(`Categoria padrão já existe com ID: ${defaultCategory.id}`);
    }

    // 3. Encontrar todos os posts com categoryId nulo
    const postsWithNullCategory = await prisma.post.findMany({
      where: {
        categoryId: null
      }
    });

    console.log(`Encontrados ${postsWithNullCategory.length} posts com categoryId nulo`);

    // 4. Atualizar os posts com categoryId nulo para usar a categoria padrão
    if (postsWithNullCategory.length > 0) {
      console.log('Atualizando posts...');
      
      let updatedCount = 0;
      for (const post of postsWithNullCategory) {
        await prisma.post.update({
          where: { id: post.id },
          data: { categoryId: defaultCategory.id }
        });
        updatedCount++;
        
        if (updatedCount % 10 === 0) {
          console.log(`Atualizados ${updatedCount} posts...`);
        }
      }
      
      console.log(`Total de ${updatedCount} posts atualizados com sucesso!`);
    }

    // 5. Verificar se todos os posts agora têm categoryId
    const remainingNullCategoryPosts = await prisma.post.count({
      where: {
        categoryId: null
      }
    });

    if (remainingNullCategoryPosts === 0) {
      console.log('Correção concluída com sucesso! Todos os posts agora têm uma categoria válida.');
    } else {
      console.log(`Atenção: Ainda existem ${remainingNullCategoryPosts} posts com categoryId nulo.`);
    }

  } catch (error) {
    console.error('Erro durante a correção:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
main()
  .then(() => {
    console.log('Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro fatal:', error);
    process.exit(1);
  }); 