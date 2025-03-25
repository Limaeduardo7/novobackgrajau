import { Router } from 'express';
import { JobController } from '../controllers/JobController';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();
const adminRouter = Router();
const jobController = new JobController();

// Rotas públicas
router.get('/', jobController.list.bind(jobController));
router.get('/featured', jobController.getFeatured.bind(jobController));
router.get('/:id', jobController.getById.bind(jobController));
router.get('/empresa/:businessId', jobController.getByBusiness.bind(jobController));
router.post('/:id/view', jobController.incrementViews.bind(jobController));
router.post('/:id/apply', jobController.incrementApplications.bind(jobController));

// Rotas autenticadas
router.post('/', requireAuth, checkPermission('create:vagas'), jobController.create.bind(jobController));
router.put('/:id', requireAuth, checkPermission('update:vagas'), jobController.update.bind(jobController));
router.delete('/:id', requireAuth, checkPermission('delete:vagas'), jobController.delete.bind(jobController));

// Rotas administrativas
adminRouter.get('/', requireAuth, checkPermission('admin'), jobController.list.bind(jobController));
adminRouter.get('/:id', requireAuth, checkPermission('admin'), jobController.getById.bind(jobController));
adminRouter.put('/:id/status', requireAuth, checkPermission('admin'), jobController.updateStatus.bind(jobController));
adminRouter.put('/:id/featured', requireAuth, checkPermission('admin'), jobController.toggleFeatured.bind(jobController));

export const jobRoutes = router;
export const jobAdminRoutes = adminRouter; 