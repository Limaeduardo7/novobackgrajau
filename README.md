# Backend Anunciar Grajaú

Backend do sistema Anunciar Grajaú, desenvolvido com Node.js, Express, TypeScript e Prisma.

## Requisitos

- Node.js 18+
- PostgreSQL 14+
- NPM ou Yarn

## Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd novobackend
```

2. Instale as dependências:
```bash
npm install
# ou
yarn
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

4. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Scripts Disponíveis

- `npm run dev`: Inicia o servidor em modo de desenvolvimento
- `npm run build`: Compila o projeto para produção
- `npm start`: Inicia o servidor em modo de produção
- `npm test`: Executa os testes

## Estrutura do Projeto

```
src/
  ├── config/         # Configurações do projeto
  ├── controllers/    # Controladores da API
  ├── middlewares/    # Middlewares do Express
  ├── models/         # Modelos do Prisma
  ├── routes/         # Rotas da API
  ├── services/       # Lógica de negócio
  ├── types/          # Tipos TypeScript
  └── utils/          # Utilitários
```

## API Endpoints

### Posts
- `GET /api/blog/posts` - Lista todos os posts
- `GET /api/blog/posts/:id` - Obtém um post específico
- `POST /api/blog/posts` - Cria um novo post
- `PUT /api/blog/posts/:id` - Atualiza um post
- `DELETE /api/blog/posts/:id` - Deleta um post

### Categorias
- `GET /api/blog/categories` - Lista todas as categorias
- `POST /api/blog/categories` - Cria uma nova categoria
- `PUT /api/blog/categories/:id` - Atualiza uma categoria
- `DELETE /api/blog/categories/:id` - Deleta uma categoria

### Tags
- `GET /api/blog/tags` - Lista todas as tags
- `POST /api/blog/tags` - Cria uma nova tag
- `PUT /api/blog/tags/:id` - Atualiza uma tag
- `DELETE /api/blog/tags/:id` - Deleta uma tag

## Autenticação

A API utiliza autenticação via Clerk. Todas as rotas de modificação (POST, PUT, DELETE) requerem um token JWT válido no header:

```
Authorization: Bearer <seu-token>
```

## Licença

MIT 