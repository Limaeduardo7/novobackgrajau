// Primeiro, precisamos instalar o pacote 'pg' executando:
// npm install pg

const { Pool } = require('pg');

// Configuração da conexão direta com o banco PostgreSQL do Supabase
const pool = new Pool({
  user: 'postgres',
  password: '#Anunciar123',
  host: 'db.fqueaxdcuyrattmadkxx.supabase.co',
  port: 5432,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false // Necessário para conexões SSL sem certificado verificado
  }
});

// Função para listar tabelas
async function listTables() {
  const client = await pool.connect();
  try {
    // Consulta para listar todas as tabelas no esquema public
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('Tabelas encontradas:');
    console.table(res.rows);
    
    // Verificar se as tabelas do blog existem
    console.log('\nVerificando tabelas específicas do blog:');
    const tables = ['posts', 'categories', 'tags', 'tags_on_posts'];
    
    for (const table of tables) {
      const exists = res.rows.some(row => row.table_name === table);
      console.log(`Tabela '${table}': ${exists ? 'Existe' : 'Não existe'}`);
    }
    
  } catch (err) {
    console.error('Erro ao listar tabelas:', err);
  } finally {
    client.release();
  }
}

// Função para obter a estrutura de uma tabela
async function getTableStructure(tableName) {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    console.log(`\nEstrutura da tabela '${tableName}':`);
    console.table(res.rows);
  } catch (err) {
    console.error(`Erro ao obter estrutura da tabela '${tableName}':`, err);
  } finally {
    client.release();
  }
}

// Executar as funções
(async () => {
  try {
    // Testar a conexão
    console.log('Testando conexão com o banco de dados...');
    console.log('Host:', pool.options.host);
    console.log('Porta:', pool.options.port);
    console.log('Usuário:', pool.options.user);
    console.log('Database:', pool.options.database);
    
    await pool.query('SELECT NOW()');
    console.log('Conexão bem-sucedida!\n');
    
    // Listar as tabelas
    await listTables();
    
    // Obter estrutura das tabelas principais (se existirem)
    const tables = ['posts', 'categories', 'tags'];
    for (const table of tables) {
      await getTableStructure(table);
    }
    
  } catch (err) {
    console.error('Erro na conexão com o banco de dados:', err);
  } finally {
    // Fechar o pool de conexões
    await pool.end();
  }
})(); 