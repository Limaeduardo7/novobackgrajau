import { Router } from 'express';
import UploadController from '../controllers/upload.controller';

const router = Router();

// Rota principal que o frontend tenta acessar
router.post('/blog/upload', UploadController.uploadMiddleware, UploadController.uploadFile.bind(UploadController));

// Rotas alternativas que o frontend tenta
router.post('/upload', UploadController.uploadMiddleware, UploadController.uploadFile.bind(UploadController));
router.post('/files/upload', UploadController.uploadMiddleware, UploadController.uploadFile.bind(UploadController));

export default router; 