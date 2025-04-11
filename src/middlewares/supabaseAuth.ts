import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';

// Estender a interface Request para incluir o user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware para verificar autenticação com Supabase ou Clerk
 * Usado especificamente para endpoints que acessam funções RPC
 * Suporta múltiplos métodos de autenticação para compatibilidade
 */
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[SUPABASE_AUTH] Verificando autenticação...');
    console.log('[SUPABASE_AUTH] Headers:', req.headers);
    
    // Extrair token do header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    
    // Log para debug
    console.log('[SUPABASE_AUTH] Token extraído:', token ? `${token.substring(0, 15)}...` : 'Nenhum');
    
    // Em ambiente de desenvolvimento, podemos permitir acesso sem token para facilitar testes
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('[SUPABASE_AUTH] ⚠️ Bypass de autenticação ativo em desenvolvimento');
      
      // Adicionar um usuário fictício para desenvolvimento
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@example.com',
        role: 'ADMIN' // Para testes, definimos como admin
      };
      
      return next();
    }
    
    // Verificar se é o token admin
    if (token === process.env.ADMIN_TOKEN) {
      console.log('[SUPABASE_AUTH] Token admin validado com sucesso');
      
      req.user = {
        id: 'admin',
        email: 'admin@anunciargrajaueregiao.com',
        role: 'ADMIN'
      };
      
      return next();
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    // Primeiro, tentar autenticação com Clerk
    try {
      console.log('[SUPABASE_AUTH] Tentando autenticação com Clerk...');
      
      // Configurar o middleware do Clerk
      const clerkMiddleware = ClerkExpressRequireAuth({
        authorizedParties: [process.env.FRONTEND_URL, process.env.API_URL].filter((url): url is string => !!url)
      });
      
      // Precisamos criar uma implementação customizada que não chama next() diretamente
      const clerkAuthPromise = new Promise((resolve, reject) => {
        // Chamamos o middleware do Clerk com um next customizado
        clerkMiddleware(req, res, (err) => {
          if (err) {
            // Se houver erro, não é um token Clerk válido
            console.log('[SUPABASE_AUTH] Token não é do Clerk ou é inválido:', err.message);
            resolve(false);
          } else {
            // Se não houver erro, é um token Clerk válido
            console.log('[SUPABASE_AUTH] Token do Clerk validado com sucesso');
            resolve(true);
          }
        });
      });
      
      const isClerkValid = await clerkAuthPromise;
      
      if (isClerkValid) {
        try {
          // Extrair informações do usuário autenticado pelo Clerk
          const userId = (req as any).auth?.userId;
          
          if (userId) {
            // Buscar dados completos do usuário
            const user = await clerkClient.users.getUser(userId);
            
            // Configurar o objeto user para uso nos controllers
            req.user = {
              id: userId,
              email: user.emailAddresses[0]?.emailAddress,
              role: 'ADMIN' // Por padrão, tratamos administradores como ADMIN
            };
            
            console.log('[SUPABASE_AUTH] Usuário Clerk autenticado:', req.user);
            return next();
          }
        } catch (clerkUserError) {
          console.error('[SUPABASE_AUTH] Erro ao obter dados do usuário Clerk:', clerkUserError);
        }
      }
    } catch (clerkError) {
      console.error('[SUPABASE_AUTH] Erro ao tentar autenticação com Clerk:', clerkError);
      // Continuamos para tentar com Supabase
    }
    
    // Se não foi autenticado com Clerk, tentar com Supabase
    try {
      console.log('[SUPABASE_AUTH] Tentando autenticação com Supabase...');
      const { data, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('[SUPABASE_AUTH] Erro na verificação do token Supabase:', error);
        
        // Em ambiente de desenvolvimento, permitir mesmo com erro
        if (process.env.NODE_ENV === 'development') {
          console.warn('[SUPABASE_AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar do erro na verificação do token');
          
          req.user = {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'dev@example.com',
            role: 'ADMIN'
          };
          
          return next();
        }
        
        return res.status(401).json({ message: 'Token inválido ou expirado' });
      }
      
      if (!data.user) {
        return res.status(401).json({ message: 'Usuário não encontrado' });
      }
      
      // Adicionar informações do usuário ao objeto req
      req.user = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.app_metadata?.role || 'USER'
      };
      
      console.log('[SUPABASE_AUTH] Usuário Supabase autenticado:', req.user);
      return next();
    } catch (supabaseError) {
      console.error('[SUPABASE_AUTH] Erro na autenticação Supabase:', supabaseError);
      
      // Em ambiente de desenvolvimento, permitir mesmo com erro
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SUPABASE_AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar do erro');
        
        req.user = {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'dev@example.com',
          role: 'ADMIN'
        };
        
        return next();
      }
      
      return res.status(401).json({ message: 'Erro na autenticação' });
    }
  } catch (error: any) {
    console.error('[SUPABASE_AUTH] Erro no middleware de autenticação:', error);
    
    // Em ambiente de desenvolvimento, permitir mesmo com erro
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SUPABASE_AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar do erro geral');
      
      req.user = {
        id: '00000000-0000-0000-0000-000000000000',
        email: 'dev@example.com',
        role: 'ADMIN'
      };
      
      return next();
    }
    
    return res.status(500).json({ 
      message: 'Erro interno no servidor',
      error: error.message 
    });
  }
};

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 */
export const checkPermission = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      
      if (!req.user || !userRole) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }
      
      if (userRole === 'ADMIN') {
        // Admins têm acesso a tudo
        return next();
      }
      
      if (role === 'SELF') {
        // Para recursos que o próprio usuário pode acessar
        // A lógica de verificação deve ser implementada no controller
        return next();
      }
      
      if (userRole !== role) {
        return res.status(403).json({ message: 'Sem permissão para acessar este recurso' });
      }
      
      next();
    } catch (error: any) {
      console.error('Erro ao verificar permissão:', error);
      return res.status(500).json({ 
        message: 'Erro interno no servidor',
        error: error.message 
      });
    }
  };
}; 