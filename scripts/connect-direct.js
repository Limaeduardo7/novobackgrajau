// Instalar o pacote pg
// npm install pg

const { Client } = require('pg');

// String de conexão direta para o PostgreSQL do Supabase
const connectionString = 'postgresql://postgres:#Anunciar123@fqueaxdcuyrattmadkxx.supabase.co:5432/postgres';

// Criar um cliente com a string de conexão
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados...');
    await client.connect();
    console.log('Conexão bem-sucedida!');

    // Consultar a versão do banco de dados
    const versionResult = await client.query('SELECT version()');
    console.log('Versão do PostgreSQL:', versionResult.rows[0].version);

    // Listar tabelas no esquema public
    console.log('\nListando tabelas no esquema public:');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tablesResult.rowCount === 0) {
      console.log('Nenhuma tabela encontrada no esquema public.');
    } else {
      console.log(`Encontradas ${tablesResult.rowCount} tabelas:`);
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }

    // Verificar se as tabelas do blog existem
    const blogTables = ['posts', 'categories', 'tags', 'tags_on_posts'];
    console.log('\nVerificando tabelas do blog:');
    
    for (const tableName of blogTables) {
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      console.log(`- Tabela '${tableName}': ${tableExists.rows[0].exists ? 'Existe' : 'Não existe'}`);
    }

  } catch (err) {
    console.error('Erro:', err);
  } finally {
    // Fechar a conexão
    await client.end();
    console.log('\nConexão encerrada.');
  }
}

// Executar a função principal
main(); 