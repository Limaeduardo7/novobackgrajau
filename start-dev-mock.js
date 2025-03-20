/**
 * Script para iniciar o servidor em modo de desenvolvimento com mocks
 * Uso: node start-dev-mock.js
 */

// Configurar variáveis de ambiente antes de importar qualquer outro módulo
process.env.NODE_ENV = 'development';
process.env.USE_MOCK_SERVICES = 'true';
process.env.PORT = process.env.PORT || '3000';

// Iniciar o servidor
console.log('Iniciando servidor em modo de desenvolvimento com mocks...');
console.log(`Porta: ${process.env.PORT}`);
console.log('Banco de dados: MOCKADO (sem conexão real)');

// Carregar o servidor
require('./dist/server'); 