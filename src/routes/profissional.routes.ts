import { Router } from 'express';
import profissionalController from '../controllers/profissional.controller';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();

// Rotas públicas específicas (colocadas antes da rota com parâmetro :id)
router.get('/search', profissionalController.searchProfissionais);
router.get('/featured', profissionalController.getProfissionaisEmDestaque);
router.get('/ocupacoes', profissionalController.getOcupacoes);
router.get('/pending', profissionalController.getPendingProfissionais);

// Rota pública principal
router.get('/', profissionalController.getProfissionais);

// Rotas de usuário (autenticadas)
router.post('/', requireAuth, profissionalController.createProfissional);
router.get('/me', requireAuth, profissionalController.getMyProfile);
router.put('/me', requireAuth, profissionalController.updateMyProfile);
router.delete('/me', requireAuth, profissionalController.deleteMyProfile);

// Rota pública por ID (deve vir depois de todas as rotas específicas)
router.get('/:id', profissionalController.getProfissionalById);

// Rota para criar dados de exemplo (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.post('/seed', profissionalController.createProfissionaisExemplo);
} else {
  // Em produção, proteger com autenticação
  router.post('/seed', requireAuth, checkPermission('admin'), profissionalController.createProfissionaisExemplo);
}

// Rotas de administração - Separar em um router próprio
const adminRouter = Router();

// Log de depuração para rotas administrativas
adminRouter.use((req, res, next) => {
  console.log(`[DEBUG] Rota administrativa acessada: ${req.method} ${req.originalUrl}`);
  next();
});

// Aplicar middleware de autenticação e verificação de permissão em todas as rotas de admin
if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
  console.log('⚠️ Bypass de autenticação ativo para rotas administrativas em desenvolvimento');
  // Em desenvolvimento, podemos optar por não usar autenticação para facilitar testes
  adminRouter.get('/', profissionalController.getAllProfissionais);
  adminRouter.get('/pending', profissionalController.getPendingProfissionais);
  adminRouter.put('/:id/status', profissionalController.updateProfissionalStatus);
  adminRouter.put('/:id/feature', profissionalController.updateProfissionalFeatured);
  adminRouter.delete('/:id', profissionalController.deleteProfissional);
} else {
  // Em produção, usamos autenticação e verificação de permissões
  adminRouter.get('/', requireAuth, checkPermission('admin'), profissionalController.getAllProfissionais);
  adminRouter.get('/pending', requireAuth, checkPermission('admin'), profissionalController.getPendingProfissionais);
  adminRouter.put('/:id/status', requireAuth, checkPermission('admin'), profissionalController.updateProfissionalStatus);
  adminRouter.put('/:id/feature', requireAuth, checkPermission('admin'), profissionalController.updateProfissionalFeatured);
  adminRouter.delete('/:id', requireAuth, checkPermission('admin'), profissionalController.deleteProfissional);
}

export const profissionalRoutes = router;
export const profissionalAdminRoutes = adminRouter; 