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
      console.log('=== SERVIÇO DE UPLOAD INICIADO ===');
      console.log('Verificando arquivo recebido...');
      
      if (!file) {
        throw new AppError(400, 'Nenhum arquivo enviado');
      }
      
      console.log('Arquivo válido recebido:', {
        nome: file.originalname,
        tipo: file.mimetype,
        tamanho: file.size
      });
      
      // Gerar nome de arquivo único
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;
      
      console.log('Nome do arquivo gerado:', fileName);
      console.log('Caminho no bucket:', filePath);
      
      // Verificar se o Supabase está configurado corretamente
      console.log('Verificando conexão com Supabase Storage...');
      console.log('URL do Supabase:', process.env.SUPABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');
      console.log('Chave API do Supabase:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'NÃO CONFIGURADA');
      
      // Upload para o Supabase Storage
      console.log('Iniciando upload para o Supabase Storage...');
      console.log('Bucket de destino: uploads');
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (error) {
        console.error('Erro no Supabase Storage:', error);
        console.error('Código do erro:', error.code);
        console.error('Mensagem do erro:', error.message);
        throw new AppError(500, `Erro ao fazer upload: ${error.message}`);
      }
      
      console.log('Upload bem-sucedido:', data);
      
      // Obter URL pública do arquivo
      console.log('Obtendo URL pública do arquivo...');
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      console.log('URL pública gerada:', publicUrl);
      console.log('=== SERVIÇO DE UPLOAD CONCLUÍDO COM SUCESSO ===');
      
      return { url: publicUrl };
    } catch (error: any) {
      console.error('=== ERRO NO SERVIÇO DE UPLOAD ===');
      console.error('Detalhes do erro:', error);
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
      
      if (error instanceof AppError) throw error;
      throw new AppError(500, `Erro no upload: ${error.message}`);
    }
  }
}

export default new UploadService(); 