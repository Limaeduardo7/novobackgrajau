import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { AppError } from './errorHandler';
import jwt from 'jsonwebtoken';

// Middleware de autenticação usando Clerk
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new AppError(401, 'Token não fornecido');
    }

    const [, token] = authHeader.split(' ');
    
    // Verifica se é o token admin
    if (token === process.env.ADMIN_TOKEN) {
      next();
      return;
    }

    // Se não for o token admin, usa o Clerk
    return ClerkExpressRequireAuth()(req, res, next);
  } catch (error) {
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