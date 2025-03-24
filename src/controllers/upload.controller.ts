import { Request, Response } from 'express';
import multer from 'multer';
import UploadService from '../services/upload.service';
import { AppError } from '../utils/AppError';

// Configuração do multer para armazenar em memória
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Verificar tipos de arquivos permitidos
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas') as any, false);
    }
  }
});

export class UploadController {
  // Middleware do multer
  uploadMiddleware = upload.single('file');
  
  async uploadFile(req: Request, res: Response) {
    try {
      console.log('Requisição de upload recebida:', req.file ? 'Com arquivo' : 'Sem arquivo');
      
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }
      
      console.log('Dados do arquivo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
      
      const folder = req.query.folder as string || 'blog';
      const result = await UploadService.uploadFile(req.file, folder);
      
      console.log('Upload realizado com sucesso:', result);
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('Erro no upload:', error);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
    }
  }
}

export default new UploadController(); 