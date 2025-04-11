import { Router } from 'express';
import { JobController } from '../controllers/JobController';
import { requireAuth, checkPermission } from '../middlewares/auth';
import { multiAuth, checkPermission as multiAuthCheckPermission } from '../middlewares/multiAuthMiddleware';

const router = Router();
const adminRouter = Router();
const jobController = new JobController();

// Rotas públicas de listagem e busca (devem vir antes da rota de ID)
router.get('/', jobController.list.bind(jobController));
router.get('/search', jobController.list.bind(jobController));
router.get('/featured', jobController.getFeatured.bind(jobController));
router.get('/empresa/:businessId', jobController.getByBusiness.bind(jobController));
// Rota específica para vagas pendentes (rota literal, não usa parâmetro)
router.get('/pending', (req, res, next) => {
  // Forçar o status para PENDING usando o enum diretamente
  req.query.status = 'PENDING';
  return jobController.list(req, res);
});

// Rotas públicas com parâmetros (devem vir depois das rotas específicas)
router.get('/:id', jobController.getById.bind(jobController));
router.post('/:id/view', jobController.incrementViews.bind(jobController));
router.post('/:id/apply', jobController.incrementApplications.bind(jobController));

// Rotas autenticadas
router.post('/', requireAuth, checkPermission('create:vagas'), jobController.create.bind(jobController));
router.put('/:id', multiAuth, multiAuthCheckPermission('update:vagas'), jobController.update.bind(jobController));
router.delete('/:id', requireAuth, checkPermission('delete:vagas'), jobController.delete.bind(jobController));

// Rotas administrativas
adminRouter.get('/', requireAuth, checkPermission('admin'), jobController.list.bind(jobController));
// Rota específica para vagas pendentes (rota literal, não usa parâmetro)
adminRouter.get('/pending', requireAuth, checkPermission('admin'), (req, res, next) => {
  // Forçar o status para PENDING usando o enum diretamente
  req.query.status = 'PENDING';
  return jobController.list(req, res);
});
adminRouter.get('/:id', requireAuth, checkPermission('admin'), jobController.getById.bind(jobController));
adminRouter.put('/:id/status', multiAuth, multiAuthCheckPermission('admin'), jobController.updateStatus.bind(jobController));
adminRouter.put('/:id/featured', multiAuth, multiAuthCheckPermission('admin'), jobController.toggleFeatured.bind(jobController));

export const jobRoutes = router;
export const jobAdminRoutes = adminRouter; 