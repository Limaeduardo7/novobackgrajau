# Guia para Testar a API do Blog no Postman

Este guia explica como testar todos os endpoints da API do blog Anunciar Grajaú usando o Postman.

## Configuração Inicial no Postman

### 1. Criar uma Coleção

1. Abra o Postman
2. Clique em "New" → "Collection"
3. Nomeie a coleção como "Anunciar Grajaú API"

### 2. Configurar Variáveis de Ambiente

1. Clique em "Environments" → "+" (Criar novo ambiente)
2. Nomeie o ambiente como "Dev" ou "Prod"
3. Adicione as seguintes variáveis:

| Variável    | Valor Inicial                       |
|-------------|-------------------------------------|
| `base_url`  | `https://api.anunciargrajau.com.br` |
| `token`     | `seu_token_jwt`                     |

4. Salve o ambiente e selecione-o para usar

## Endpoints para Testes

### Posts

#### 1. Listar todos os posts

```
GET {{base_url}}/api/blog/posts
```

Parâmetros de consulta opcionais:
- `page`: número da página (ex: 1)
- `limit`: itens por página (ex: 10)
- `published`: filtrar por status de publicação (true/false)
- `featured`: filtrar por destaque (true/false)
- `categoryId`: filtrar por categoria
- `authorId`: filtrar por autor
- `search`: buscar por termo
- `tags[]`: filtrar por tags (pode incluir múltiplos)
- `sortBy`: campo para ordenação (ex: "createdAt")
- `order`: direção da ordenação ("asc" ou "desc")

#### 2. Obter um post específico

```
GET {{base_url}}/api/blog/posts/123456
```

Substitua "123456" pelo ID real do post.

#### 3. Criar um novo post

```
POST {{base_url}}/api/blog/posts
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "title": "Título do Post",
  "content": "Conteúdo do post em formato longo...",
  "image": "https://exemplo.com/imagem.jpg",
  "published": false,
  "featured": false,
  "authorId": "id_do_autor",
  "categoryId": "id_da_categoria",
  "tags": ["tag1", "tag2"]
}
```

Observações:
- O campo `slug` será gerado automaticamente a partir do título
- Se `published` for `true`, o campo `publishedAt` será preenchido automaticamente

#### 4. Atualizar um post existente

```
PUT {{base_url}}/api/blog/posts/123456
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "title": "Título Atualizado",
  "content": "Conteúdo atualizado...",
  "featured": true,
  "published": true,
  "tags": ["tag1", "tag3"]
}
```

Substitua "123456" pelo ID real do post.

Observações:
- Se o título for alterado, o `slug` será atualizado automaticamente
- Se `published` mudar de `false` para `true`, o campo `publishedAt` será definido automaticamente

#### 5. Deletar um post

```
DELETE {{base_url}}/api/blog/posts/123456
Headers:
  Authorization: Bearer {{token}}
```

Substitua "123456" pelo ID real do post.

### Categorias

#### 1. Listar todas as categorias

```
GET {{base_url}}/api/blog/categories
```

#### 2. Criar uma nova categoria

```
POST {{base_url}}/api/blog/categories
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Nome da Categoria",
  "description": "Descrição da categoria"
}
```

Observação: O `slug` será gerado automaticamente a partir do nome

#### 3. Atualizar uma categoria

```
PUT {{base_url}}/api/blog/categories/123456
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Novo Nome da Categoria",
  "description": "Nova descrição da categoria"
}
```

Substitua "123456" pelo ID real da categoria.

#### 4. Deletar uma categoria

```
DELETE {{base_url}}/api/blog/categories/123456
Headers:
  Authorization: Bearer {{token}}
```

Substitua "123456" pelo ID real da categoria.

### Tags

#### 1. Listar todas as tags

```
GET {{base_url}}/api/blog/tags
```

#### 2. Criar uma nova tag

```
POST {{base_url}}/api/blog/tags
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Nome da Tag",
  "description": "Descrição da tag"
}
```

Observação: O `slug` será gerado automaticamente a partir do nome

#### 3. Atualizar uma tag

```
PUT {{base_url}}/api/blog/tags/123456
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

Body:
{
  "name": "Novo Nome da Tag",
  "description": "Nova descrição da tag"
}
```

Substitua "123456" pelo ID real da tag.

#### 4. Deletar uma tag

```
DELETE {{base_url}}/api/blog/tags/123456
Headers:
  Authorization: Bearer {{token}}
```

Substitua "123456" pelo ID real da tag.

## Obtendo um Token JWT para Autenticação

Para obter um token JWT do Clerk para uso nos testes:

1. Faça login no frontend da aplicação
2. Abra as ferramentas de desenvolvedor (F12)
3. Vá para a aba "Application" (ou "Aplicação")
4. Em "Local Storage", procure por `__clerk_client_jwt`
5. Copie o valor do token
6. Cole na variável de ambiente `token` no Postman

## Fluxo de Teste Recomendado

1. Comece criando categorias
2. Depois crie algumas tags
3. Em seguida, crie posts associando-os às categorias e tags
4. Liste os posts para verificar se aparecem corretamente
5. Obtenha um post específico
6. Atualize um post
7. Delete um post
8. Delete tags e categorias

## Dicas para Testes

1. Para ordenação, você pode usar `sortBy=createdAt&order=desc` para obter os posts mais recentes primeiro
2. Use o parâmetro `search` para buscar por termos nos títulos e conteúdos dos posts
3. Para filtrar por tags específicas, use `tags[]=tag1&tags[]=tag2`
4. Salve os IDs criados durante os testes para reutilizar em outras requisições

## Códigos de Status Esperados

- 200: Sucesso (GET, PUT)
- 201: Criação bem-sucedida (POST)
- 400: Erro de validação
- 401: Não autenticado
- 403: Não autorizado
- 404: Recurso não encontrado
- 500: Erro interno do servidor 