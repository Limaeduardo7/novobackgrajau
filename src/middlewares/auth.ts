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
      // Por enquanto, vamos apenas passar
      next();
    } catch (error) {
      next(new AppError(403, 'Acesso não autorizado'));
    }
  };
}; 