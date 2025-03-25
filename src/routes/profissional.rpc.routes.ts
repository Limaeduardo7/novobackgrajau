import { Router } from 'express';
import profissionalRpcController from '../controllers/profissional.rpc.controller';
import { supabaseAuth, checkPermission } from '../middlewares/supabaseAuth';

const router = Router();

/**
 * @route   GET /api/profissionais/me
 * @desc    Obter perfil profissional do usuário autenticado
 * @access  Private
 */
router.get('/me', supabaseAuth, profissionalRpcController.getMyProfile);

/**
 * @route   GET /api/profissionais/user/:userId
 * @desc    Obter perfil profissional por ID do usuário
 * @access  Private (Admin ou próprio usuário)
 */
router.get('/user/:userId', supabaseAuth, profissionalRpcController.getByUserId);

/**
 * @route   POST /api/profissionais
 * @desc    Criar novo perfil profissional
 * @access  Private
 */
router.post('/', supabaseAuth, profissionalRpcController.createProfile);

/**
 * @route   PUT /api/profissionais/:id
 * @desc    Atualizar perfil profissional existente
 * @access  Private (próprio usuário ou admin)
 */
router.put('/:id', supabaseAuth, profissionalRpcController.updateProfile);

/**
 * @route   DELETE /api/profissionais/:id
 * @desc    Excluir perfil profissional
 * @access  Private (próprio usuário ou admin)
 */
router.delete('/:id', supabaseAuth, profissionalRpcController.deleteProfile);

export const profissionalRpcRoutes = router; 