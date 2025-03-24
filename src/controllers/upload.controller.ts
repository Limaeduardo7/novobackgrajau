import { Request, Response } from 'express';
import * as multer from 'multer';
import UploadService from '../services/upload.service';
import { AppError } from '../utils/AppError';

// Definição da interface para Request com file
interface MulterRequest extends Request {
  file?: any;
}

// Configuração do multer
const storage = multer.memoryStorage();
const upload = multer.default({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

export class UploadController {
  // Middleware do multer
  uploadMiddleware = upload.single('file');
  
  async uploadFile(req: MulterRequest, res: Response) {
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