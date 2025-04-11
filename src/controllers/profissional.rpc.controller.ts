import { Request, Response } from 'express';
import profissionalRepository from '../repositories/ProfissionalRepository';
import { AppError } from '../utils/AppError';

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
      console.log('[RPC_UPDATE] Iniciando atualização do perfil:', id);
      console.log('[RPC_UPDATE] Dados do usuário:', req.user);
      console.log('[RPC_UPDATE] Dados recebidos:', JSON.stringify(req.body, null, 2));
      
      // Extrair dados do usuário
      // @ts-ignore - req.user é adicionado pelo middleware de autenticação
      const userId = req.user?.id;
      // @ts-ignore
      const isAdmin = req.user?.role === 'ADMIN';
      
      if (!userId) {
        console.log('[RPC_UPDATE] Tentativa de atualização sem userId');
        return res.status(401).json({ 
          message: 'Usuário não autenticado'
        });
      }
      
      console.log('[RPC_UPDATE] Usuário autenticado:', { userId, isAdmin });
      
      // Para administradores, podemos atualizar qualquer perfil
      if (isAdmin) {
        console.log('[RPC_UPDATE] Usuário é administrador, atualizando perfil:', id);
        
        // Preparar dados para atualização
        const updateData = { ...req.body };
        delete updateData.user_id; // Não permitir alterar user_id
        
        try {
          const result = await profissionalRepository.update(id, updateData);
          console.log('[RPC_UPDATE] Perfil atualizado com sucesso pelo admin');
          return res.json(result);
        } catch (error: any) {
          console.error('[RPC_UPDATE] Erro ao atualizar perfil pelo admin:', error);
          throw error;
        }
      }
      
      // Para usuários comuns, verificar se o perfil pertence a eles
      console.log('[RPC_UPDATE] Verificando propriedade do perfil para usuário comum');
      
      // Verificar se o perfil existe e pertence ao usuário
      const response = await profissionalRepository.getByUserId(userId);
      const existingProfile = response?.data;
      
      if (!existingProfile) {
        console.log('[RPC_UPDATE] Perfil não encontrado para o usuário');
        return res.status(404).json({ 
          message: 'Perfil profissional não encontrado' 
        });
      }
      
      // Verificar se o ID do perfil corresponde ao ID solicitado
      if (existingProfile.id !== id) {
        console.log('[RPC_UPDATE] ID do perfil não corresponde ao solicitado:', {
          profileId: existingProfile.id,
          requestedId: id
        });
        return res.status(403).json({ 
          message: 'Sem permissão para editar este perfil' 
        });
      }
      
      // Preparar dados para atualização (sem alterar user_id, status e featured)
      const updateData = { ...req.body };
      delete updateData.user_id;
      delete updateData.status;
      delete updateData.featured;
      
      console.log('[RPC_UPDATE] Atualizando perfil para usuário comum:', id);
      
      const result = await profissionalRepository.update(id, updateData);
      console.log('[RPC_UPDATE] Perfil atualizado com sucesso');
      res.json(result);
    } catch (error: any) {
      console.error('[RPC_UPDATE] Erro ao atualizar perfil profissional:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ 
          message: error.message 
        });
      }
      
      return res.status(500).json({ 
        message: 'Erro ao atualizar perfil profissional',
        error: error.message 
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
}

export default new ProfissionalRpcController(); 