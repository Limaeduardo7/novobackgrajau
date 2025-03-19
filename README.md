# Backend Anunciar Grajaú

API RESTful para o portal de anúncios e blog do Anunciar Grajaú.

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL (Supabase)
- JWT Authentication

## Requisitos

- Node.js 16+
- npm 7+
- PostgreSQL 14+

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/Limaeduardo7/novobackgrajau.git
cd novobackgrajau
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais.

5. Gere o cliente Prisma:

```bash
npx prisma generate
```

6. Inicie o servidor em desenvolvimento:

```bash
npm run dev
```

## Implantação em Produção

1. Configure o arquivo `.env.production`
2. Execute o script de implantação:

```bash
chmod +x deploy.sh
./deploy.sh
```

Alternativamente, siga os passos manualmente:

```bash
git pull origin master
npm install
cp .env.production .env
npx prisma generate
npm run build
pm2 restart novobackgrajau || pm2 start dist/src/server.js --name novobackgrajau
```

## Estrutura do Projeto

```
src/
├── controllers/      # Controladores da API
├── middlewares/      # Middlewares Express
├── models/           # Modelos de dados
├── routes/           # Rotas da API
├── services/         # Serviços de negócios
├── types/            # Definições de tipos TypeScript
├── utils/            # Funções utilitárias
└── server.ts         # Ponto de entrada da aplicação
```

## API Endpoints

### Autenticação

- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/refresh-token` - Renovar token

### Blog

#### Categorias

- `GET /api/blog/categories` - Listar categorias
- `GET /api/blog/categories/:id` - Obter categoria
- `POST /api/blog/categories` - Criar categoria
- `PUT /api/blog/categories/:id` - Atualizar categoria
- `DELETE /api/blog/categories/:id` - Excluir categoria

#### Tags

- `GET /api/blog/tags` - Listar tags
- `GET /api/blog/tags/:id` - Obter tag
- `POST /api/blog/tags` - Criar tag
- `PUT /api/blog/tags/:id` - Atualizar tag
- `DELETE /api/blog/tags/:id` - Excluir tag

#### Posts

- `GET /api/blog/posts` - Listar posts
- `GET /api/blog/posts/:id` - Obter post
- `POST /api/blog/posts` - Criar post
- `PUT /api/blog/posts/:id` - Atualizar post
- `DELETE /api/blog/posts/:id` - Excluir post

### Usuários

- `GET /api/users` - Listar usuários
- `GET /api/users/:id` - Obter usuário
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Excluir usuário

## Banco de Dados

O projeto utiliza Prisma ORM com PostgreSQL hospedado no Supabase. A estrutura do banco de dados está definida em `prisma/schema.prisma`.

Para aplicar migrações:

```bash
npx prisma migrate dev
```

Em produção:

```bash
npx prisma migrate deploy
```

## Permissões Supabase

Para configurar as permissões corretas no Supabase:

```sql
-- Conceder acesso à roles de serviço para todas as tabelas no schema public
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON SCHEMA public TO service_role;
```

## Licença

© 2023 Anunciar Grajaú. Todos os direitos reservados. 