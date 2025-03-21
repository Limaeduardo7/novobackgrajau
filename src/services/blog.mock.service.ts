import { Category, Post, PaginatedResponse, PaginationParams, Tag, User, UserRole, UserStatus } from '../types/blog';
import { AppError } from '../middlewares/errorHandler';

// Função para gerar IDs únicos sem depender do pacote uuid
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Dados mock para desenvolvimento local
const mockCategories: Category[] = [
  { id: '1', name: 'Notícias', slug: 'noticias', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Eventos', slug: 'eventos', createdAt: new Date(), updatedAt: new Date() },
];

const mockTags: Tag[] = [
  { id: '1', name: 'Saúde', slug: 'saude', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'Educação', slug: 'educacao', createdAt: new Date(), updatedAt: new Date() },
];

const mockUsers: User[] = [
  { 
    id: '1', 
    clerkId: 'user_123456789',
    name: 'Admin Teste', 
    email: 'admin@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Post de teste',
    slug: 'post-de-teste',
    content: 'Conteúdo do post de teste',
    published: true,
    featured: false,
    publishedAt: new Date(),
    authorId: '1',
    categoryId: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: []
  }
];

// Helpers
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const simulateNetworkDelay = () => delay(300); // Simula 300ms de latência

export class BlogMockService {
  // Categories
  async getCategories(): Promise<{ data: Category[] }> {
    await simulateNetworkDelay();
    return { data: [...mockCategories] };
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    await simulateNetworkDelay();
    return mockCategories.find(cat => cat.slug === slug) || null;
  }

  async createCategory(data: { name: string }): Promise<{ data: Category, message: string }> {
    await simulateNetworkDelay();
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const newCategory: Category = {
      id: generateId(),
      name: data.name,
      slug,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockCategories.push(newCategory);
    return {
      data: newCategory,
      message: 'Categoria criada com sucesso'
    };
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<{ data: Category, message: string }> {
    await simulateNetworkDelay();
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('Categoria não encontrada');
    }
    
    const updatedCategory = {
      ...mockCategories[index],
      ...data,
      updatedAt: new Date()
    };
    
    if (data.name) {
      updatedCategory.slug = data.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    mockCategories[index] = updatedCategory;
    return {
      data: updatedCategory,
      message: 'Categoria atualizada com sucesso'
    };
  }

  async deleteCategory(id: string): Promise<{ message: string }> {
    await simulateNetworkDelay();
    const index = mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) {
      throw new Error('Categoria não encontrada');
    }
    mockCategories.splice(index, 1);
    return { message: 'Categoria deletada com sucesso' };
  }

  // Tags
  async getTags(): Promise<{ data: Tag[] }> {
    await simulateNetworkDelay();
    return { data: [...mockTags] };
  }

  async getTagBySlug(slug: string): Promise<Tag | null> {
    await simulateNetworkDelay();
    return mockTags.find(tag => tag.slug === slug) || null;
  }

  async createTag(data: { name: string }): Promise<{ data: Tag, message: string }> {
    await simulateNetworkDelay();
    const slug = data.name.toLowerCase().replace(/\s+/g, '-');
    const newTag: Tag = {
      id: generateId(),
      name: data.name,
      slug,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockTags.push(newTag);
    return {
      data: newTag,
      message: 'Tag criada com sucesso'
    };
  }

  async updateTag(id: string, data: Partial<Tag>): Promise<{ data: Tag, message: string }> {
    await simulateNetworkDelay();
    const index = mockTags.findIndex(tag => tag.id === id);
    if (index === -1) {
      throw new Error('Tag não encontrada');
    }
    
    const updatedTag = {
      ...mockTags[index],
      ...data,
      updatedAt: new Date()
    };
    
    if (data.name) {
      updatedTag.slug = data.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    mockTags[index] = updatedTag;
    return {
      data: updatedTag,
      message: 'Tag atualizada com sucesso'
    };
  }

  async deleteTag(id: string): Promise<{ message: string }> {
    await simulateNetworkDelay();
    const index = mockTags.findIndex(tag => tag.id === id);
    if (index === -1) {
      throw new Error('Tag não encontrada');
    }
    mockTags.splice(index, 1);
    return { message: 'Tag deletada com sucesso' };
  }

  // Posts
  async getPosts(params: PaginationParams): Promise<PaginatedResponse<Post>> {
    await simulateNetworkDelay();
    const { page = 1, limit = 10 } = params;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const data = mockPosts.slice(startIndex, endIndex);
    return {
      data,
      pagination: {
        total: mockPosts.length,
        page,
        limit,
        totalPages: Math.ceil(mockPosts.length / limit)
      }
    };
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    await simulateNetworkDelay();
    return mockPosts.find(post => post.slug === slug) || null;
  }

  async getPostById(id: string, options: { validCategoryOnly?: boolean } = {}): Promise<{ data: Post }> {
    const { validCategoryOnly } = options;
    await simulateNetworkDelay();
    
    const post = mockPosts.find(p => p.id === id);
    
    if (!post) {
      throw new AppError(404, 'Post não encontrado');
    }
    
    if (validCategoryOnly && !post.categoryId) {
      throw new AppError(400, 'Post sem categoria válida');
    }
    
    return { data: post };
  }

  async createPost(data: any, options: { allowNullCategory?: boolean } = {}): Promise<{ data: Post, message: string }> {
    await simulateNetworkDelay();
    const slug = data.title.toLowerCase().replace(/\s+/g, '-');
    
    const newPost: Post = {
      id: generateId(),
      title: data.title,
      slug: slug,
      content: data.content,
      image: data.image,
      published: data.published || false,
      publishedAt: data.published ? new Date() : null,
      featured: data.featured || false,
      authorId: data.authorId || mockUsers[0].id,
      categoryId: data.categoryId,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: data.tags || []
    };
    
    mockPosts.push(newPost);
    return { 
      data: newPost,
      message: 'Post criado com sucesso'
    };
  }

  async updatePost(id: string, data: Partial<Post>, options: { allowNullCategory?: boolean } = {}): Promise<{ data: Post, message: string }> {
    await simulateNetworkDelay();
    const index = mockPosts.findIndex(post => post.id === id);
    if (index === -1) {
      throw new Error('Post não encontrado');
    }
    
    const updatedPost = { ...mockPosts[index], ...data, updatedAt: new Date() };
    
    if (data.title) {
      updatedPost.slug = data.title.toLowerCase().replace(/\s+/g, '-');
    }
    
    if (data.published && !mockPosts[index].published) {
      updatedPost.publishedAt = new Date();
    }
    
    if (data.categoryId) {
      updatedPost.categoryId = data.categoryId;
    }
    
    mockPosts[index] = updatedPost;
    return { 
      data: updatedPost, 
      message: 'Post atualizado com sucesso' 
    };
  }

  async deletePost(id: string): Promise<void> {
    await simulateNetworkDelay();
    const index = mockPosts.findIndex(post => post.id === id);
    if (index === -1) {
      throw new Error('Post não encontrado');
    }
    mockPosts.splice(index, 1);
  }
}

// Exportar uma instância singleton do serviço
export default new BlogMockService(); 