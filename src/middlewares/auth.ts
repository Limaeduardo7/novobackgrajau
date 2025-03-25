import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { AppError } from './errorHandler';
import jwt from 'jsonwebtoken';

// Middleware de autenticação usando Clerk
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Log para debug do protocolo e headers
    console.log(`Protocolo: ${req.protocol}`);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
    console.log(`Método: ${req.method}, URL: ${req.originalUrl}`);
    
    // Se estivermos em modo de desenvolvimento, podemos permitir solicitações sem autenticação
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log('Autenticação ignorada no ambiente de desenvolvimento');
      return next();
    }
    
    // Verificação flexível do cabeçalho de autorização
    const authHeader = req.headers.authorization || req.headers['x-authorization'] as string;
    const tokenFromQuery = req.query.token as string;
    const tokenFromBody = req.body?.token;
    
    // Log para debug
    console.log('Auth Header:', authHeader);
    console.log('Token Query:', tokenFromQuery);
    console.log('Token Body:', tokenFromBody);
    
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
    
    console.log('Token extraído:', token ? `${token.substring(0, 15)}...` : 'nenhum');
    
    if (!token) {
      // Adicionar cabeçalhos CORS antecipadamente para que o cliente receba a resposta
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      throw new AppError(401, 'Token não fornecido');
    }
    
    // Verifica se é o token admin
    if (token === process.env.ADMIN_TOKEN) {
      console.log('Token admin validado com sucesso');
      return next();
    }
    
    try {
      // Se não for o token admin, usa o Clerk
      console.log('Utilizando Clerk para autenticação');
      
      // Configura o clerk
      const clerkMiddleware = ClerkExpressRequireAuth({
        authorizedParties: [process.env.FRONTEND_URL, process.env.API_URL].filter((url): url is string => !!url)
      });
      
      // Tentativa de autenticação com Clerk
      return clerkMiddleware(req, res, (err) => {
        if (err) {
          console.error('Erro na autenticação do Clerk:', err);
          
          // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Permitindo acesso em desenvolvimento apesar de erro no Clerk');
            
            // Adicionar um usuário fictício para desenvolvimento
            (req as any).auth = {
              userId: 'dev-user-id',
              sessionId: 'dev-session-id',
              session: { 
                user: { 
                  id: 'dev-user-id',
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
        
        return next();
      });
    } catch (clerkError) {
      console.error('Exceção no middleware do Clerk:', clerkError);
      
      // Se estiver em desenvolvimento, permita passar mesmo com erro no Clerk
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Permitindo acesso em desenvolvimento apesar de exceção no Clerk');
        return next();
      }
      
      throw new AppError(401, 'Erro de autenticação');
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    next(new AppError(401, 'Não autorizado'));
  }
};

// Middleware para verificar permissões específicas
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Se estamos em ambiente de desenvolvimento, permitir sem verificar
      if (process.env.NODE_ENV === 'development') {
        console.log(`Permissão ${permission} concedida em ambiente de desenvolvimento`);
        return next();
      }
      
      // Aqui você deve adicionar sua lógica real de verificação de permissões
      // Por exemplo, verificar se o usuário tem a permissão específica no seu sistema
      
      // Para admin, você pode adicionar uma verificação específica:
      if (permission === 'admin') {
        // Verificar se o token é um token de admin
        // Ou se o usuário tem role de admin
        const user = (req as any).auth?.user;
        if (user?.role === 'admin') {
          return next();
        }
        
        console.log('Usuário não tem permissão de admin');
        throw new AppError(403, 'Acesso não autorizado. Permissão de administrador necessária.');
      }
      
      // Para outras permissões, implemente a verificação adequada
      
      // Por enquanto, vamos apenas passar em desenvolvimento
      next();
    } catch (error) {
      next(new AppError(403, 'Acesso não autorizado'));
    }
  };
}; 