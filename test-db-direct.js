// Teste direto de conexão com PostgreSQL usando a URL hardcoded
require('dotenv').config();
const { Client } = require('pg');

// URL de conexão usando a porta padrão do PostgreSQL (5432)
const DATABASE_URL = "postgresql://postgres:%23Anunciar123@fqueaxdcuyrattmadkxx.supabase.co:5432/postgres?schema=public";
console.log('Testando conexão direta com:', DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));

// Extrai informações da URL para diagnóstico
const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
const match = DATABASE_URL.match(regex);
if (match) {
  console.log('Informações de conexão:');
  console.log('- Usuário:', match[1]);
  console.log('- Host:', match[3]);
  console.log('- Porta:', match[4]);
  console.log('- Banco:', match[5]);
} else {
  console.warn('Não foi possível extrair informações da URL');
}

// Teste de DNS
const dns = require('dns');
if (match && match[3]) {
  console.log(`Resolvendo DNS para ${match[3]}...`);
  dns.lookup(match[3], (err, address, family) => {
    if (err) {
      console.error('Erro ao resolver DNS:', err.message);
    } else {
      console.log(`Endereço IP: ${address} (IPv${family})`);
    }
  });
}

// Configurando o cliente PostgreSQL
const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões com Supabase
  },
  connectionTimeoutMillis: 10000, // 10 segundos de timeout
});

// Adicione listener de erro para capturar problemas
client.on('error', (err) => {
  console.error('Erro no cliente PG:', err.message);
});

async function testConnection() {
  try {
    console.log('Tentando conectar...');
    await client.connect();
    console.log('Conexão estabelecida!');
    
    // Teste básico - verificar se consegue executar uma query
    const result = await client.query('SELECT NOW() as time');
    console.log('Hora no servidor:', result.rows[0].time);
    
    // Listar tabelas
    console.log('Listando tabelas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('Nenhuma tabela encontrada no schema public');
    } else {
      console.log('Tabelas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log(` - ${row.table_name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('ERRO DE CONEXÃO:', error);
    console.error('Detalhes:', JSON.stringify({
      code: error.code,
      detail: error.detail,
      message: error.message,
      hint: error.hint
    }, null, 2));
    return false;
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.log('Erro ao desconectar:', e.message);
    }
  }
}

// Aguardar um pouco para a resolução DNS completar
setTimeout(() => {
  testConnection()
    .then(success => {
      console.log(success ? 'TESTE BEM-SUCEDIDO ✅' : 'TESTE FALHOU ❌');
      process.exit(success ? 0 : 1);
    });
}, 1000); 