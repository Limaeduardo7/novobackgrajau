# Backend API - Grajau

API de gerenciamento de conteúdo e blog para o projeto Grajau.

## Configurações

O projeto suporta diferentes modos de operação:

1. **Produção**: Conecta-se diretamente ao banco Supabase
2. **Desenvolvimento com banco real**: Conecta-se ao Supabase com keepalive
3. **Desenvolvimento com mock**: Usa dados simulados sem conectar ao banco

## Pré-requisitos

- Node.js 18+
- NPM ou Yarn

## Instalação

```bash
# Clonar o repositório
git clone https://github.com/Limaeduardo7/novobackgrajau.git
cd novobackgrajau

# Instalar dependências
npm install

# Construir o projeto
npm run build
```

## Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Principais variáveis:

- `NODE_ENV`: Ambiente (development/production)
- `PORT`: Porta do servidor (padrão: 3000)
- `USE_MOCK_SERVICES`: Habilita serviços mock (true/false)
- `DATABASE_USE_LOCAL`: Usa banco local em desenvolvimento (true/false)

## Executando o Servidor

### Modo Produção

```bash
npm start
```

### Modo Desenvolvimento (com banco real)

```bash
npm run dev
```

### Modo Desenvolvimento (com mock)

```bash
npm run dev:mock
```

## Estrutura do Projeto

```
/src
  /config      - Configurações da aplicação
  /controllers - Controladores da API
  /lib         - Bibliotecas e utilitários
  /middlewares - Middlewares Express
  /routes      - Rotas da API
  /services    - Serviços de negócio
  /types       - Definições de tipos TypeScript
```

## Problema de Conexão com Supabase Local

O acesso ao banco de dados Supabase pode falhar em ambiente de desenvolvimento local por restrições de rede. Opções para solucionar:

1. Use o modo mock para desenvolvimento: `USE_MOCK_SERVICES=true`
2. Configure um banco de dados PostgreSQL local
3. Solicite à equipe do Supabase permissões específicas de IP para desenvolvimento

## API Endpoints

### Posts
- GET `/api/blog/posts` - Listar posts
- GET `/api/blog/posts/:id` - Obter post por ID
- POST `/api/blog/posts` - Criar post
- PUT `/api/blog/posts/:id` - Atualizar post
- DELETE `/api/blog/posts/:id` - Remover post

### Categorias
- GET `/api/blog/categories` - Listar categorias
- POST `/api/blog/categories` - Criar categoria
- PUT `/api/blog/categories/:id` - Atualizar categoria
- DELETE `/api/blog/categories/:id` - Remover categoria

### Tags
- GET `/api/blog/tags` - Listar tags
- POST `/api/blog/tags` - Criar tag
- PUT `/api/blog/tags/:id` - Atualizar tag
- DELETE `/api/blog/tags/:id` - Remover tag

## Licença

Este projeto é privado e proprietário.

## Contato

Para suporte, contate: (seu contato) 