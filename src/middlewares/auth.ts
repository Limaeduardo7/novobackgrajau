import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import { AppError } from './errorHandler';

// Middleware de autenticação usando Clerk
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[AUTH] Protocolo:', req.protocol);
    console.log('[AUTH] Headers:', req.headers);
    
    console.log('[AUTH] Método:', req.method, 'URL:', req.originalUrl);
    
    // Extrair o token do cabeçalho Authorization, query ou body
    const authHeader = req.headers.authorization;
    console.log('[AUTH] Auth Header:', authHeader);
    
    const queryToken = req.query.token as string | undefined;
    console.log('[AUTH] Token Query:', queryToken);
    
    const bodyToken = req.body?.token as string | undefined;
    console.log('[AUTH] Token Body:', bodyToken);
    
    // Verificar token em diferentes lugares
    let token: string | undefined;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' do início
      console.log('[AUTH] Token extraído:', token.substring(0, 20) + '...');
    } else if (queryToken) {
      token = queryToken;
      console.log('[AUTH] Token extraído da query');
    } else if (bodyToken) {
      token = bodyToken;
      console.log('[AUTH] Token extraído do body');
    }
    
    if (!token) {
      // Adicionar cabeçalhos CORS antecipadamente para que o cliente receba a resposta
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      // Em ambiente de desenvolvimento, permitir requisições sem token
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AUTH] ⚠️ Permitindo acesso sem token em ambiente de desenvolvimento');
        (req as any).auth = {
          userId: 'dev-user',
          isAdmin: false,
          session: {
            user: {
              id: 'dev-user',
              email: 'dev@example.com',
              firstName: 'Dev',
              lastName: 'User'
            }
          }
        };
        return next();
      }

      throw new AppError(401, 'Token não fornecido');
    }
    
    // Verifica se é o token admin
    if (token === process.env.ADMIN_TOKEN) {
      console.log('[AUTH] Token admin validado com sucesso');
      (req as any).auth = {
        userId: 'admin',
        isAdmin: true,
        session: { 
          user: { 
            id: 'admin',
            role: 'admin'
          } 
        }
      };
      return next();
    }
    
    try {
      // Se não for o token admin, usa o Clerk
      console.log('[AUTH] Utilizando Clerk para autenticação');
      
      // Configura o clerk
      const clerkMiddleware = ClerkExpressRequireAuth({
        authorizedParties: [process.env.FRONTEND_URL, process.env.API_URL].filter((url): url is string => !!url)
      });
      
      // Tentativa de autenticação com Clerk
      return clerkMiddleware(req, res, async (err) => {
        if (err) {
          console.error('[AUTH] Erro na autenticação do Clerk:', err);
          
          // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de erro no Clerk');
            
            // Adicionar um usuário fictício para desenvolvimento
            (req as any).auth = {
              userId: '00000000-0000-0000-0000-000000000000',
              sessionId: 'dev-session-id',
              session: { 
                user: { 
                  id: '00000000-0000-0000-0000-000000000000',
                  email: 'dev@example.com',
                  firstName: 'Dev',
                  lastName: 'User' 
                } 
              }
            };
            
            return next();
          }
          
          // Em produção, retorne erro normalmente
          return res.status(401).json({ error: 'Autenticação inválida' });
        }
        
        try {
          // Extrair e logar informações do usuário autenticado
          const userId = (req as any).auth?.userId;
          
          if (!userId) {
            throw new AppError(401, 'ID do usuário não encontrado');
          }
          
          // Inicializar a estrutura auth se não existir
          if (!(req as any).auth) {
            (req as any).auth = {};
          }
          
          if (!(req as any).auth.session) {
            (req as any).auth.session = {};
          }
          
          // Buscar dados completos do usuário
          const user = await clerkClient.users.getUser(userId);
          
          // Atualizar os dados da sessão com as informações completas
          (req as any).auth.session.user = {
            id: userId,
            email: user.emailAddresses[0]?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName
          };
          
          console.log('[AUTH] Usuário autenticado:', {
            userId,
            email: user.emailAddresses[0]?.emailAddress,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim()
          });
          
          return next();
        } catch (error) {
          console.error('[AUTH] Erro ao buscar dados do usuário:', error);
          
          // Se estiver em desenvolvimento, permita passar mesmo com erro ao buscar dados
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de erro ao buscar dados do usuário');
            
            // Adicionar um usuário fictício para desenvolvimento
            (req as any).auth = {
              userId: '00000000-0000-0000-0000-000000000000',
              sessionId: 'dev-session-id',
              session: { 
                user: { 
                  id: '00000000-0000-0000-0000-000000000000',
                  email: 'dev@example.com',
                  firstName: 'Dev',
                  lastName: 'User' 
                } 
              }
            };
            
            return next();
          }
          
          return res.status(401).json({ error: 'Erro ao obter dados do usuário' });
        }
      });
    } catch (clerkError) {
      console.error('[AUTH] Exceção no middleware do Clerk:', clerkError);
      
      // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de exceção no Clerk');
        
        // Adicionar um usuário fictício para desenvolvimento
        (req as any).auth = {
          userId: '00000000-0000-0000-0000-000000000000',
          sessionId: 'dev-session-id',
          session: { 
            user: { 
              id: '00000000-0000-0000-0000-000000000000',
              email: 'dev@example.com',
              firstName: 'Dev',
              lastName: 'User' 
            } 
          }
        };
        
        return next();
      }
      
      return res.status(401).json({ error: 'Erro de autenticação' });
    }
  } catch (error) {
    console.error('[AUTH] Erro na autenticação:', error);
    
    // Em ambiente de desenvolvimento, permitir mesmo com erro geral
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de erro na autenticação');
      
      // Adicionar um usuário fictício para desenvolvimento
      (req as any).auth = {
        userId: '00000000-0000-0000-0000-000000000000',
        sessionId: 'dev-session-id',
        session: { 
          user: { 
            id: '00000000-0000-0000-0000-000000000000',
            email: 'dev@example.com',
            firstName: 'Dev',
            lastName: 'User' 
          } 
        }
      };
      
      return next();
    }
    
    return res.status(401).json({ error: 'Não autorizado' });
  }
};

// Middleware para verificar permissões específicas
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se estamos em ambiente de desenvolvimento, permitir sem verificar
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERM] Permissão ${permission} concedida em ambiente de desenvolvimento`);
        return next();
      }
      
      // Para admin, verificar se é um token admin ou usuário com role admin
      if (permission === 'admin') {
        const isAdmin = (req as any).auth?.isAdmin || (req as any).auth?.session?.user?.role === 'admin';
        
        if (isAdmin) {
          console.log('[PERM] Acesso de administrador validado');
          return next();
        }
        
        console.log('[PERM] Usuário não tem permissão de admin');
        throw new AppError(403, 'Acesso não autorizado. Permissão de administrador necessária.');
      }
      
      // Para outras permissões específicas
      const user = (req as any).auth?.session?.user;
      if (!user) {
        throw new AppError(401, 'Usuário não autenticado');
      }
      
      // Aqui você pode implementar verificações específicas de permissão
      // Por exemplo, verificar se o usuário tem a permissão no seu perfil
      
      next();
    } catch (error) {
      next(new AppError(403, 'Acesso não autorizado'));
    }
  };
}; 