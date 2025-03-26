import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { AppError } from './errorHandler';

// Middleware de autenticação usando Clerk
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Log para debug do protocolo e headers
    console.log(`[AUTH] Protocolo: ${req.protocol}`);
    console.log(`[AUTH] Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`[AUTH] Método: ${req.method}, URL: ${req.originalUrl}`);
    
    // Se estivermos em modo de desenvolvimento, podemos permitir solicitações sem autenticação
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('[AUTH] Autenticação ignorada no ambiente de desenvolvimento');
      // Adicionar um usuário fictício para desenvolvimento com UUID válido
      (req as any).auth = {
        userId: '00000000-0000-0000-0000-000000000000', // UUID válido para desenvolvimento
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
    
    // Verificação flexível do cabeçalho de autorização
    const authHeader = req.headers.authorization || req.headers['x-authorization'] as string;
    const tokenFromQuery = req.query.token as string;
    const tokenFromBody = req.body?.token;
    
    // Log para debug
    console.log('[AUTH] Auth Header:', authHeader);
    console.log('[AUTH] Token Query:', tokenFromQuery);
    console.log('[AUTH] Token Body:', tokenFromBody);
    
    // Tentar obter o token de várias fontes
    let token: string | undefined;
    
    if (authHeader) {
      // Se for Bearer, extrair o token
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else {
        // Se não começar com Bearer, pode ser o token direto
        token = authHeader;
      }
    } else if (tokenFromQuery) {
      token = tokenFromQuery;
    } else if (tokenFromBody) {
      token = tokenFromBody;
    }
    
    console.log('[AUTH] Token extraído:', token ? `${token.substring(0, 15)}...` : 'nenhum');
    
    if (!token) {
      // Adicionar cabeçalhos CORS antecipadamente para que o cliente receba a resposta
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
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
      return clerkMiddleware(req, res, (err) => {
        if (err) {
          console.error('[AUTH] Erro na autenticação do Clerk:', err);
          
          // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
          if (process.env.NODE_ENV === 'development') {
            console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de erro no Clerk');
            
            // Adicionar um usuário fictício para desenvolvimento com UUID válido
            (req as any).auth = {
              userId: '00000000-0000-0000-0000-000000000000', // UUID válido para desenvolvimento
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
          return next(new AppError(401, 'Autenticação inválida'));
        }
        
        // Extrair e logar informações do usuário autenticado
        const userId = (req as any).auth?.userId;
        const user = (req as any).auth?.session?.user;
        
        console.log('[AUTH] Usuário autenticado:', {
          userId,
          email: user?.email,
          name: `${user?.firstName} ${user?.lastName}`
        });
        
        return next();
      });
    } catch (clerkError) {
      console.error('[AUTH] Exceção no middleware do Clerk:', clerkError);
      
      // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AUTH] ⚠️ Permitindo acesso em desenvolvimento apesar de exceção no Clerk');
        return next();
      }
      
      throw new AppError(401, 'Erro de autenticação');
    }
  } catch (error) {
    console.error('[AUTH] Erro na autenticação:', error);
    next(new AppError(401, 'Não autorizado'));
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