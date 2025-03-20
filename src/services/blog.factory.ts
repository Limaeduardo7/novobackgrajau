/**
 * Factory para o serviço de blog
 * Seleciona entre o serviço real (Supabase) e o serviço mock com base nas configurações
 */

import { FEATURES } from '../config/environment';
import BlogSupabaseService from './blog.supabase.service';
import BlogMockService from './blog.mock.service';

// Exporta o serviço apropriado com base na configuração
const BlogService = FEATURES.USE_MOCK_IN_DEV 
  ? BlogMockService  // Usa o serviço mock se estiver em dev e USE_MOCK_SERVICES for true
  : BlogSupabaseService; // Usa o serviço real por padrão

export default BlogService; 