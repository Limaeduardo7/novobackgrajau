/**
 * Fábrica para os serviços de blog
 * 
 * Este arquivo escolhe a implementação correta do serviço de blog
 * baseado na configuração ou no ambiente.
 */

import { BlogSupabaseService } from './blog.supabase.service';
import { BlogMockService } from './blog.mock.service';

// Determinar qual implementação usar
const useMockService = process.env.USE_MOCK_SERVICE === 'true';

// Exportar a instância adequada do serviço
const BlogService = useMockService ? new BlogMockService() : new BlogSupabaseService();

export default BlogService; 