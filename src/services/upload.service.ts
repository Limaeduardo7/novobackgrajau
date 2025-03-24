import { supabase } from '../lib/supabase';
import { AppError } from '../utils/AppError';

// Definição da interface para o arquivo do Multer
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class UploadService {
  async uploadFile(file: MulterFile, folder: string = 'blog'): Promise<{ url: string }> {
    try {
      if (!file) {
        throw new AppError(400, 'Nenhum arquivo enviado');
      }
      
      // Gerar nome de arquivo único
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (error) {
        console.error('Erro no Supabase Storage:', error);
        throw new AppError(500, `Erro ao fazer upload: ${error.message}`);
      }
      
      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      return { url: publicUrl };
    } catch (error: any) {
      console.error('Erro no serviço de upload:', error);
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Erro no upload: ${error.message}`);
    }
  }
}

export default new UploadService(); 