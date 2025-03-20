// Teste direto de conexão com PostgreSQL
require('dotenv').config();
const { Client } = require('pg');

// Configuração explícita do cliente
const config = {
  user: 'postgres',
  password: '#Anunciar123',
  host: 'fqueaxdcuyrattmadkxx.supabase.co',
  port: 6543,
  database: 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
};

console.log('Configuração de conexão explícita:');
console.log('Host:', config.host);
console.log('Porta:', config.port);
console.log('Banco:', config.database);
console.log('Usuário:', config.user);

const client = new Client(config);

async function testConnection() {
  try {
    await client.connect();
    console.log('Conexão bem-sucedida!');
    
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora no servidor:', res.rows[0].time);
    
    return true;
  } catch (err) {
    console.error('Erro ao conectar:', err.message);
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.error('Erro ao desconectar:', e.message);
    }
  }
}

testConnection()
  .then(success => {
    if (success) {
      console.log('Teste concluído com sucesso!');
      process.exit(0);
    } else {
      console.error('Teste falhou!');
      process.exit(1);
    }
  }); 