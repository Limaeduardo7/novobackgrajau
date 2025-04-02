import { Router } from 'express';
import { EmpresaController } from '../controllers/empresa.controller';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();
const adminRouter = Router();
const empresaController = new EmpresaController();

// Rotas públicas
router.get('/', empresaController.getEmpresas);
router.get('/search', empresaController.searchEmpresas);
router.get('/featured', empresaController.getEmpresasEmDestaque);
router.get('/category', empresaController.getEmpresasByCategory);
router.get('/categorias', empresaController.getCategorias);
router.get('/:id', empresaController.getEmpresaById);

// Rotas que requerem autenticação
router.post('/', requireAuth, checkPermission('create:empresas'), empresaController.createEmpresa);
router.put('/:id', requireAuth, checkPermission('update:empresas'), empresaController.updateEmpresa);
router.delete('/:id', requireAuth, checkPermission('delete:empresas'), empresaController.deleteEmpresa);

// Rota para criar dados de exemplo (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  router.post('/seed', empresaController.createEmpresasExemplo);
} else {
  // Em produção, proteger com autenticação
  router.post('/seed', requireAuth, checkPermission('admin'), empresaController.createEmpresasExemplo);
}

// Rotas administrativas
adminRouter.get('/', requireAuth, checkPermission('admin'), empresaController.getEmpresas);
adminRouter.get('/pending', requireAuth, checkPermission('admin'), empresaController.getPendingEmpresas);
adminRouter.get('/:id', requireAuth, checkPermission('admin'), empresaController.getEmpresaById);
adminRouter.post('/', requireAuth, checkPermission('admin'), empresaController.createEmpresa);
adminRouter.put('/:id', requireAuth, checkPermission('admin'), empresaController.updateEmpresa);
adminRouter.put('/:id/status', requireAuth, checkPermission('admin'), empresaController.updateEmpresaStatus);
adminRouter.delete('/:id', requireAuth, checkPermission('admin'), empresaController.deleteEmpresa);

export const empresaRoutes = router;
export const empresaAdminRoutes = adminRouter; 