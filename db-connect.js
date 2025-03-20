// Teste direto de conexão com PostgreSQL
require('dotenv').config();
const { Client } = require('pg');

const connectionString = process.env.DIRECT_URL || '';
console.log('Tentando conectar diretamente ao banco de dados usando DIRECT_URL');

// Remover senha para exibição
const sanitizedUrl = connectionString.replace(/:([^:@]+)@/, ':***@');
console.log('URL de conexão (sanitizada):', sanitizedUrl);

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Necessário para algumas instâncias do Supabase
  }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Conexão bem-sucedida!');
    
    const res = await client.query('SELECT NOW() as time, current_database() as db, current_user as user');
    console.log('Informações do servidor:', res.rows[0]);
    
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Tabelas encontradas:', tableRes.rows.map(r => r.table_name).join(', '));
    
    return true;
  } catch (err) {
    console.error('Erro ao conectar:', err);
    return false;
  } finally {
    await client.end();
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