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
    
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(401, 'Token não fornecido');
    }

    const [authType, token] = authHeader.split(' ');
    
    if (!token) {
      throw new AppError(401, 'Formato de token inválido');
    }
    
    console.log(`Tipo de Auth: ${authType}, Token presente: ${!!token}`);
    
    // Verifica se é o token admin
    if (token === process.env.ADMIN_TOKEN) {
      console.log('Token admin validado com sucesso');
      next();
      return;
    }

    // Se não for o token admin, usa o Clerk
    console.log('Utilizando Clerk para autenticação');
    return ClerkExpressRequireAuth({
      // Opções para o Clerk, se necessário
      // Não altera comportamento se for HTTPS ou HTTP
      authorizedParties: [process.env.FRONTEND_URL, process.env.API_URL].filter((url): url is string => !!url)
    })(req, res, next);
  } catch (error) {
    console.error('Erro na autenticação:', error);
    next(new AppError(401, 'Não autorizado'));
  }
};

// Middleware para verificar permissões específicas
export const checkPermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Aqui você pode implementar sua lógica de verificação de permissões
      // Por exemplo, verificar se o usuário tem a role necessária
      // Por enquanto, vamos apenas passar
      next();
    } catch (error) {
      next(new AppError(403, 'Acesso não autorizado'));
    }
  };
}; 