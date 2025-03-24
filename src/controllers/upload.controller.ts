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
    console.log('Multer fileFilter chamado:', file.mimetype);
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
      console.log('=== INÍCIO DO PROCESSO DE UPLOAD ===');
      console.log('Requisição de upload recebida:', req.originalUrl);
      console.log('Método:', req.method);
      console.log('Headers:', JSON.stringify(req.headers));
      console.log('Foi enviado arquivo?', req.file ? 'Sim' : 'Não');
      
      if (!req.file) {
        console.error('Erro: Nenhum arquivo enviado na requisição');
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }
      
      console.log('Dados do arquivo:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
      });
      
      const folder = req.query.folder as string || 'blog';
      console.log('Pasta de destino:', folder);
      
      console.log('Chamando o serviço de upload...');
      const result = await UploadService.uploadFile(req.file, folder);
      
      console.log('Upload realizado com sucesso:', result);
      console.log('=== FIM DO PROCESSO DE UPLOAD ===');
      return res.status(201).json(result);
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSO DE UPLOAD ===');
      console.error('Detalhes do erro:', error);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro ao fazer upload do arquivo: ' + error.message });
    }
  }
}

export default new UploadController(); 