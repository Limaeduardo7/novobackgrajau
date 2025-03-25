import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

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
 * Middleware para verificar autenticação com Supabase
 * Usado especificamente para endpoints que acessam funções RPC
 */
export const supabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair token do header Authorization
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    // Verificar token JWT com Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
    
    // Adicionar informações do usuário ao objeto req
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.app_metadata?.role || 'USER'
    };
    
    next();
  } catch (error: any) {
    console.error('Erro no middleware de autenticação Supabase:', error);
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