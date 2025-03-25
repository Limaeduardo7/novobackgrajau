import { Router } from 'express';
import profissionalController from '../controllers/profissional.controller';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();

// Rotas públicas
router.get('/', profissionalController.getProfissionais);
router.get('/search', profissionalController.searchProfissionais);
router.get('/featured', profissionalController.getProfissionaisEmDestaque);
router.get('/ocupacoes', profissionalController.getOcupacoes);
router.get('/:id', profissionalController.getProfissionalById);

// Rota para criar dados de exemplo (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.post('/seed', profissionalController.createProfissionaisExemplo);
} else {
  // Em produção, proteger com autenticação
  router.post('/seed', requireAuth, checkPermission('admin'), profissionalController.createProfissionaisExemplo);
}

// Rotas de usuário (autenticadas)
router.post('/', requireAuth, profissionalController.createProfissional);
router.get('/me', requireAuth, profissionalController.getMyProfile);
router.put('/me', requireAuth, profissionalController.updateMyProfile);
router.delete('/me', requireAuth, profissionalController.deleteMyProfile);

// Rotas de administração
const adminRouter = Router();

adminRouter.get('/', requireAuth, checkPermission('admin'), profissionalController.getAllProfissionais);
adminRouter.put('/:id/status', requireAuth, checkPermission('admin'), profissionalController.updateProfissionalStatus);
adminRouter.put('/:id/feature', requireAuth, checkPermission('admin'), profissionalController.updateProfissionalFeatured);
adminRouter.delete('/:id', requireAuth, checkPermission('admin'), profissionalController.deleteProfissional);

export const profissionalRoutes = router;
export const profissionalAdminRoutes = adminRouter; 