import { Router } from 'express';
import { JobApplicationController } from '../controllers/JobApplicationController';
import { requireAuth } from '../middlewares/auth';

const router = Router();
const jobApplicationController = new JobApplicationController();

// Rotas que requerem autenticação
router.get('/', requireAuth, jobApplicationController.list.bind(jobApplicationController));
router.get('/pending', requireAuth, (req, res) => {
  req.query.status = 'PENDING';
  return jobApplicationController.list(req, res);
});
router.get('/:id', requireAuth, jobApplicationController.getById.bind(jobApplicationController));
router.post('/', requireAuth, jobApplicationController.create.bind(jobApplicationController));
router.put('/:id', requireAuth, jobApplicationController.update.bind(jobApplicationController));
router.delete('/:id', requireAuth, jobApplicationController.delete.bind(jobApplicationController));

export default router; 