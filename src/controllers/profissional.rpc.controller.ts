import { Request, Response } from 'express';
import profissionalRepository from '../repositories/ProfissionalRepository';
import { AppError } from '../utils/AppError';
import { supabase } from '../lib/supabase';

export class ProfissionalRpcController {
  /**
   * Obtém o perfil profissional do usuário autenticado
   * Utiliza a função RPC do Supabase
   */
  async getMyProfile(req: Request, res: Response) {
    try {
      const result = await profissionalRepository.getMyProfile();
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message 
        });
      }
      
      console.error('Erro ao buscar perfil profissional:', error);
      
      if (error.message.includes('not found') || error.statusCode === 404) {
        return res.status(404).json({ 
          message: 'Perfil profissional não encontrado' 
        });
      }
      
      return res.status(500).json({ 
        message: 'Erro ao buscar perfil profissional',
        error: error.message 
      });
    }
  }

  /**
   * Obtém o perfil profissional pelo ID do usuário
   * Utiliza a função RPC do Supabase
   */
  async getByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      // Verificar se o usuário tem permissão (é admin ou o próprio usuário)
      // @ts-ignore - req.user é adicionado pelo middleware de autenticação
      const isAdmin = req.user.role === 'ADMIN';
      // @ts-ignore
      const isSelfProfile = req.user.id === userId;
      
      if (!isAdmin && !isSelfProfile) {
        return res.status(403).json({ 
          message: 'Sem permissão para acessar este perfil' 
        });
      }
      
      const result = await profissionalRepository.getByUserId(userId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message 
        });
      }
      
      console.error('Erro ao buscar perfil por ID:', error);
      
      if (error.message.includes('not found') || error.statusCode === 404) {
        return res.status(404).json({ 
          message: 'Perfil profissional não encontrado' 
        });
      }
      
      return res.status(500).json({ 
        message: 'Erro ao buscar perfil profissional',
        error: error.message 
      });
    }
  }

  /**
   * Cria um novo perfil profissional
   */
  async createProfile(req: Request, res: Response) {
    try {
      // @ts-ignore - req.user é adicionado pelo middleware de autenticação
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(401).json({ 
          message: 'Usuário não autenticado' 
        });
      }
      
      // Preparar dados para inserção
      const profileData = {
        user_id: userId,
        nome: req.body.nome,
        email: req.body.email,
        telefone: req.body.telefone,
        ocupacao: req.body.ocupacao,
        sobre: req.body.sobre,
        experiencia: req.body.experiencia,
        educacao: req.body.educacao,
        certificacoes: req.body.certificacoes,
        especialidades: req.body.especialidades,
        valor_hora: req.body.valor_hora,
        disponibilidade: req.body.disponibilidade,
        portfolio: req.body.portfolio,
        foto: req.body.foto,
        website: req.body.website,
        endereco: req.body.endereco,
        cidade: req.body.cidade,
        estado: req.body.estado,
        social_media: req.body.social_media,
        status: 'PENDING' // Novos perfis começam como pendentes para aprovação
      };
      
      // Validar dados básicos
      if (!profileData.nome) {
        return res.status(400).json({ message: 'Nome é obrigatório' });
      }
      
      if (!profileData.ocupacao) {
        return res.status(400).json({ message: 'Ocupação é obrigatória' });
      }
      
      const result = await profissionalRepository.create(profileData);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message 
        });
      }
      
      console.error('Erro ao criar perfil profissional:', error);
      return res.status(500).json({ 
        message: 'Erro ao criar perfil profissional',
        error: error.message 
      });
    }
  }

  /**
   * Atualiza um perfil profissional existente
   */
  async updateProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('[RPC_UPDATE] =================================');
      console.log('[RPC_UPDATE] Iniciando atualização do perfil:', id);
      console.log('[RPC_UPDATE] Request headers:', JSON.stringify(req.headers, null, 2));
      console.log('[RPC_UPDATE] Request user (multiAuth):', JSON.stringify(req.user, null, 2));
      console.log('[RPC_UPDATE] Request auth (singleAuth):', JSON.stringify((req as any).auth, null, 2));
      console.log('[RPC_UPDATE] Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      // Verificar dados de autenticação (suporte para ambos os middlewares)
      // @ts-ignore - req.user é adicionado pelo middleware multiAuth
      let userId = req.user?.id;
      // @ts-ignore
      let isAdmin = req.user?.role === 'ADMIN';
      
      // Se não temos user, verificar se há auth do middleware singleAuth
      if (!userId) {
        // @ts-ignore - req.auth é adicionado pelo middleware singleAuth
        userId = (req as any).auth?.userId;
        // @ts-ignore
        isAdmin = (req as any).auth?.role === 'ADMIN';
      }
      
      console.log('[RPC_UPDATE] Dados de autenticação extraídos:', { userId, isAdmin });
      
      if (!userId) {
        console.log('[RPC_UPDATE] ERRO: Usuário não autenticado - userId não encontrado');
        return res.status(401).json({ 
          message: 'Usuário não autenticado - Token inválido ou expirado',
          debug: {
            hasReqUser: !!req.user,
            hasReqAuth: !!(req as any).auth,
            userKeys: req.user ? Object.keys(req.user) : null,
            authKeys: (req as any).auth ? Object.keys((req as any).auth) : null
          }
        });
      }
      
      // Validar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.log('[RPC_UPDATE] ERRO: ID não é um UUID válido:', id);
        return res.status(400).json({ 
          message: 'ID do perfil inválido - deve ser um UUID' 
        });
      }
      
      // Para administradores, podemos atualizar qualquer perfil
      if (isAdmin) {
        console.log('[RPC_UPDATE] Usuário é administrador, atualizando perfil:', id);
        
        // Preparar dados para atualização
        const updateData = { ...req.body };
        delete updateData.user_id; // Não permitir alterar user_id
        
        console.log('[RPC_UPDATE] Dados para atualização (admin):', JSON.stringify(updateData, null, 2));
        
        try {
          const result = await profissionalRepository.update(id, updateData);
          console.log('[RPC_UPDATE] Perfil atualizado com sucesso pelo admin');
          return res.json({ 
            data: result,
            message: 'Perfil atualizado com sucesso'
          });
        } catch (error: any) {
          console.error('[RPC_UPDATE] Erro ao atualizar perfil pelo admin:', error);
          throw error;
        }
      }
      
      // Para usuários comuns, verificar se o perfil pertence a eles
      console.log('[RPC_UPDATE] Verificando propriedade do perfil para usuário comum');
      
      try {
        // Verificar se o perfil existe e pertence ao usuário
        const existingProfile = await profissionalRepository.getByUserId(userId);
        console.log('[RPC_UPDATE] Perfil existente encontrado:', !!existingProfile);
        
        if (!existingProfile) {
          console.log('[RPC_UPDATE] ERRO: Perfil não encontrado para o usuário');
          return res.status(404).json({ 
            message: 'Perfil profissional não encontrado para este usuário' 
          });
        }
        
        // Verificar se o ID do perfil corresponde ao ID solicitado
        if (existingProfile.id !== id) {
          console.log('[RPC_UPDATE] ERRO: ID do perfil não corresponde ao solicitado:', {
            profileId: existingProfile.id,
            requestedId: id,
            userId: userId
          });
          return res.status(403).json({ 
            message: 'Sem permissão para editar este perfil - ID não corresponde' 
          });
        }
        
        // Preparar dados para atualização (sem alterar user_id, status e featured)
        const updateData = { ...req.body };
        delete updateData.user_id;
        delete updateData.status;
        delete updateData.featured;
        
        console.log('[RPC_UPDATE] Dados para atualização (usuário comum):', JSON.stringify(updateData, null, 2));
        console.log('[RPC_UPDATE] Atualizando perfil para usuário comum:', id);
        
        const result = await profissionalRepository.update(id, updateData);
        console.log('[RPC_UPDATE] Perfil atualizado com sucesso');
        
        return res.json({ 
          data: result,
          message: 'Perfil atualizado com sucesso'
        });
        
      } catch (profileError: any) {
        console.error('[RPC_UPDATE] Erro ao buscar/verificar perfil existente:', profileError);
        
        if (profileError instanceof AppError && profileError.statusCode === 404) {
          return res.status(404).json({ 
            message: 'Perfil profissional não encontrado para este usuário' 
          });
        }
        throw profileError;
      }
      
    } catch (error: any) {
      console.error('[RPC_UPDATE] =================================');
      console.error('[RPC_UPDATE] ERRO GERAL ao atualizar perfil profissional:', error);
      console.error('[RPC_UPDATE] Tipo do erro:', typeof error);
      console.error('[RPC_UPDATE] Nome do erro:', error.name);
      console.error('[RPC_UPDATE] Mensagem do erro:', error.message);
      console.error('[RPC_UPDATE] Stack do erro:', error.stack);
      console.error('[RPC_UPDATE] Status Code do erro:', error.statusCode);
      console.error('[RPC_UPDATE] =================================');
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message,
          error: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        });
      }
      
      return res.status(500).json({ 
        message: 'Erro interno ao atualizar perfil profissional',
        error: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        debug: {
          type: typeof error,
          name: error.name,
          statusCode: error.statusCode
        }
      });
    }
  }

  /**
   * Exclui um perfil profissional
   */
  async deleteProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // @ts-ignore - req.user é adicionado pelo middleware de autenticação
      const userId = req.user.id;
      // @ts-ignore
      const isAdmin = req.user.role === 'ADMIN';
      
      // Verificar se o perfil existe e pertence ao usuário
      const { data: existingProfile, error: fetchError } = await profissionalRepository.getByUserId(userId);
      
      if (!existingProfile) {
        return res.status(404).json({ 
          message: 'Perfil profissional não encontrado' 
        });
      }
      
      // Verificar permissão
      if (!isAdmin && existingProfile.user_id !== userId) {
        return res.status(403).json({ 
          message: 'Sem permissão para excluir este perfil' 
        });
      }
      
      const result = await profissionalRepository.delete(id);
      res.json(result);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message 
        });
      }
      
      console.error('Erro ao excluir perfil profissional:', error);
      return res.status(500).json({ 
        message: 'Erro ao excluir perfil profissional',
        error: error.message 
      });
    }
  }

  /**
   * Método de teste para debug do erro 500
   */
  async testUpdate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      console.log('[TEST_UPDATE] =================================');
      console.log('[TEST_UPDATE] ID recebido:', id);
      console.log('[TEST_UPDATE] Body recebido:', JSON.stringify(req.body, null, 2));
      console.log('[TEST_UPDATE] Headers:', JSON.stringify(req.headers, null, 2));
      console.log('[TEST_UPDATE] User:', JSON.stringify(req.user, null, 2));
      console.log('[TEST_UPDATE] Auth:', JSON.stringify((req as any).auth, null, 2));
      
      // Verificar se conseguimos buscar o perfil pelo ID diretamente
      const { data: profile, error } = await supabase
        .from('profissionais')
        .select('*')
        .eq('id', id)
        .single();
      
      console.log('[TEST_UPDATE] Perfil encontrado:', !!profile);
      console.log('[TEST_UPDATE] Erro na busca:', error);
      
      if (profile) {
        console.log('[TEST_UPDATE] Dados do perfil:', JSON.stringify(profile, null, 2));
        
        // Tentar uma atualização simples
        const { data: updated, error: updateError } = await supabase
          .from('profissionais')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
        
        console.log('[TEST_UPDATE] Atualização bem-sucedida:', !!updated);
        console.log('[TEST_UPDATE] Erro na atualização:', updateError);
      }
      
      return res.json({
        status: 'OK',
        profileFound: !!profile,
        profileData: profile,
        error: error,
        message: 'Teste concluído - verifique os logs do servidor'
      });
      
    } catch (error: any) {
      console.error('[TEST_UPDATE] Erro no teste:', error);
      return res.status(500).json({
        error: 'Erro no teste',
        message: error.message,
        stack: error.stack
      });
    }
  }
}

export default new ProfissionalRpcController(); 