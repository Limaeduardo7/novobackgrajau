# Guia de Teste dos Endpoints no Postman usando Supabase

Este guia mostra como testar a API do blog Anunciar Grajaú usando Postman integrado com Supabase.

## Configuração do Postman

### 1. Variáveis de Ambiente

Crie um ambiente no Postman com as seguintes variáveis:

| Variável    | Valor Inicial                      | Descrição                 |
|-------------|------------------------------------|-----------------------------|
| `URL_BASE`  | `https://api.anunciargrajau.com.br` | URL base da API            |
| `TOKEN`     | `seu_token_jwt`                    | Token de autenticação       |
| `SUPABASE_KEY` | `sua_chave_anon_do_supabase`    | Chave anônima do Supabase   |

### 2. Headers Padrão para Autenticação

Para requisições autenticadas, adicione estes headers:

```
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
apikey: {{SUPABASE_KEY}}
```

## Testando os Endpoints

### Posts

#### Listar Posts
```
GET {{URL_BASE}}/api/blog/posts
```

Parâmetros (Query):
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 10)
- `published`: filtrar posts publicados (true/false)
- `featured`: filtrar posts em destaque (true/false)
- `categoryId`: filtrar por categoria
- `authorId`: filtrar por autor
- `search`: busca por termo
- `sortBy`: campo para ordenação (padrão: created_at)
- `order`: direção de ordenação (asc/desc)

#### Obter Post por ID
```
GET {{URL_BASE}}/api/blog/posts/:id
```

#### Criar Post
```
POST {{URL_BASE}}/api/blog/posts
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "title": "Meu post de teste",
  "content": "Conteúdo do post...",
  "excerpt": "Resumo do post...",
  "image": "https://example.com/image.jpg",
  "status": "draft",
  "featured": false,
  "published": false,
  "authorId": "id_do_autor",
  "categoryId": "id_da_categoria",
  "tags": ["id_tag_1", "id_tag_2"]
}
```

#### Atualizar Post
```
PUT {{URL_BASE}}/api/blog/posts/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "title": "Título atualizado",
  "content": "Conteúdo atualizado...",
  "featured": true
}
```

#### Deletar Post
```
DELETE {{URL_BASE}}/api/blog/posts/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  apikey: {{SUPABASE_KEY}}
```

### Categorias

#### Listar Categorias
```
GET {{URL_BASE}}/api/blog/categories
```

#### Criar Categoria
```
POST {{URL_BASE}}/api/blog/categories
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "name": "Tecnologia",
  "description": "Posts sobre tecnologia"
}
```

#### Atualizar Categoria
```
PUT {{URL_BASE}}/api/blog/categories/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "name": "Nova Tecnologia",
  "description": "Nova descrição de tecnologia"
}
```

#### Deletar Categoria
```
DELETE {{URL_BASE}}/api/blog/categories/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  apikey: {{SUPABASE_KEY}}
```

### Tags

#### Listar Tags
```
GET {{URL_BASE}}/api/blog/tags
```

#### Criar Tag
```
POST {{URL_BASE}}/api/blog/tags
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "name": "JavaScript",
  "description": "Posts sobre JavaScript"
}
```

#### Atualizar Tag
```
PUT {{URL_BASE}}/api/blog/tags/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  Content-Type: application/json
  apikey: {{SUPABASE_KEY}}

Body:
{
  "name": "TypeScript",
  "description": "Posts sobre TypeScript"
}
```

#### Deletar Tag
```
DELETE {{URL_BASE}}/api/blog/tags/:id
Headers:
  Authorization: Bearer {{TOKEN}}
  apikey: {{SUPABASE_KEY}}
```

## Obtendo o Token e Chave do Supabase

### Token JWT (via Clerk)

1. Faça login no frontend da aplicação
2. Abra o DevTools (F12)
3. Vá na aba "Application" ou "Aplicação"
4. Em "Local Storage", procure por `__clerk_client_jwt`
5. Copie o valor do token
6. Cole na variável de ambiente `TOKEN` no Postman

### Chave do Supabase (apikey)

1. Acesse o painel do Supabase
2. Vá para Configurações > API
3. Copie a "anon key" (chave anônima)
4. Cole na variável de ambiente `SUPABASE_KEY` no Postman

## Fluxo de Teste Recomendado

1. Liste as categorias e tags existentes
2. Crie uma nova categoria
3. Crie uma nova tag
4. Crie um novo post usando a categoria e tag criadas
5. Liste os posts e confirme que seu post aparece
6. Atualize o post
7. Delete o post
8. Delete a tag
9. Delete a categoria

## Troubleshooting

### Erro 401 (Não Autorizado)
- Verifique se o token JWT é válido e não expirou
- Confirme se está usando o header `Authorization: Bearer {{TOKEN}}`
- Verifique se a chave anônima do Supabase está correta

### Erro 404 (Não Encontrado)
- Verifique se o ID do recurso está correto
- Confirme se o endpoint está correto

### Erro 500 (Erro do Servidor)
- Verifique os logs do servidor
- Confirme se o corpo da requisição está correto 