import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { blogRoutes } from './routes/blog.routes';
import systemRoutes from './routes/system.routes';
import uploadRoutes from './routes/upload.routes';
import { empresaRoutes } from './routes/empresa.routes';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Configuração de CORS melhorada
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'https://anunciargrajaueregiao.com',
    // Adicione outros domínios permitidos
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Tratamento especial para requisições OPTIONS (preflight)
app.options('*', (req, res) => {
  console.log('Requisição OPTIONS recebida:', req.originalUrl);
  
  // Configurar cabeçalhos CORS manualmente para ter certeza
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 horas
  
  // Responder com 200 OK sem conteúdo
  res.status(200).end();
});

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para adicionar informações de debug à requisição
app.use((req, res, next) => {
  console.log(`Recebida requisição: ${req.method} ${req.url}`);
  console.log(`Protocolo: ${req.protocol}`);
  console.log(`Secure: ${req.secure}`);
  console.log(`X-Forwarded-Proto: ${req.get('x-forwarded-proto')}`);
  
  // Adiciona uma propriedade personalizada para verificar se é HTTPS
  (req as any).isSecureRequest = req.secure || req.get('x-forwarded-proto') === 'https';
  
  next();
});

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

// Adicionar middleware para redirecionar /businesses para /api/empresas
app.use('/businesses', (req, res, next) => {
  console.log(`Redirecionando de /businesses para /api/empresas - URL original: ${req.originalUrl}`);
  // Redirecionamento direto é mais seguro
  res.redirect(307, `/api/empresas${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de businesses
app.use('/businesses/*', (req, res) => {
  // Extrair o caminho após /businesses/
  const path = req.originalUrl.replace('/businesses', '');
  console.log(`Redirecionando para: /api/empresas${path}`);
  // Redirecionar para o caminho equivalente em /api/empresas
  res.redirect(307, `/api/empresas${path}`);
});

// Adicionar middleware para redirecionar /admin/businesses para /api/empresas
app.use('/admin/businesses', (req, res, next) => {
  console.log(`Redirecionando de /admin/businesses para /api/empresas - URL original: ${req.originalUrl}`);
  // Redirecionamento direto
  res.redirect(307, `/api/empresas${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de admin/businesses
app.use('/admin/businesses/*', (req, res) => {
  // Extrair o caminho após /admin/businesses/
  const path = req.originalUrl.replace('/admin/businesses', '');
  console.log(`Redirecionando para: /api/empresas${path}`);
  // Redirecionar para o caminho equivalente em /api/empresas
  res.redirect(307, `/api/empresas${path}`);
});

// Rotas
app.use('/api/blog', blogRoutes);
app.use('/api/system', systemRoutes);
app.use('/api', uploadRoutes);
app.use('/api/empresas', empresaRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 