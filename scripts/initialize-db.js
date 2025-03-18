// Este script usa Prisma para inicializar o banco de dados
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Inicializando banco de dados...');

    // 1. Criar categorias de exemplo
    console.log('Criando categorias...');
    const category1 = await prisma.category.create({
      data: {
        name: 'Tecnologia',
        description: 'Posts sobre tecnologia e inovação',
        slug: 'tecnologia'
      }
    });

    const category2 = await prisma.category.create({
      data: {
        name: 'Notícias',
        description: 'Notícias e novidades da região',
        slug: 'noticias'
      }
    });

    console.log('Categorias criadas:', category1.id, category2.id);

    // 2. Criar tags de exemplo
    console.log('Criando tags...');
    const tag1 = await prisma.tag.create({
      data: {
        name: 'Grajau',
        description: 'Conteúdos sobre Grajaú',
        slug: 'grajau'
      }
    });

    const tag2 = await prisma.tag.create({
      data: {
        name: 'Eventos',
        description: 'Eventos e acontecimentos',
        slug: 'eventos'
      }
    });

    console.log('Tags criadas:', tag1.id, tag2.id);

    // 3. Criar um post de exemplo
    console.log('Criando post de exemplo...');
    const post = await prisma.post.create({
      data: {
        title: 'Meu primeiro post',
        content: 'Este é o conteúdo do meu primeiro post no blog.',
        excerpt: 'Um resumo do meu primeiro post',
        status: 'PUBLISHED',
        featured: true,
        published: true,
        authorId: 'user_2b8wk2QKrftxIzQT8TQFtFmCgJf', // ID fictício, substitua por um ID real
        categoryId: category1.id,
        tags: {
          create: [
            { tagId: tag1.id },
            { tagId: tag2.id }
          ]
        }
      }
    });

    console.log('Post criado:', post.id);

    // 4. Listar todos os dados criados
    console.log('\nVerificando dados criados:');
    
    const categories = await prisma.category.findMany();
    console.log('Categorias:', categories.length);
    
    const tags = await prisma.tag.findMany();
    console.log('Tags:', tags.length);
    
    const posts = await prisma.post.findMany({
      include: {
        category: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    });
    
    console.log('Posts:', posts.length);
    console.log('Primeiro post:', {
      id: posts[0].id,
      title: posts[0].title,
      category: posts[0].category.name,
      tags: posts[0].tags.map(t => t.tag.name)
    });

    console.log('\nBanco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 