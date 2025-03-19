import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { blogRoutes } from './routes/blog.routes';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Adicionar middleware para redirecionar /public/blog para /api/blog
app.use('/public/blog', (req, res, next) => {
  // Modificar o URL para apontar para a rota de API correta
  req.url = '/api/blog' + req.url;
  next('route');
});

// Rota alternativa para capturar requisições redirecionadas
app.use('/public/blog/*', (req, res) => {
  // Extrair o caminho após /public/blog/
  const path = req.originalUrl.replace('/public/blog', '');
  // Redirecionar para o caminho equivalente em /api/blog
  res.redirect(307, `/api/blog${path}`);
});

// Rotas
app.use('/api/blog', blogRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 