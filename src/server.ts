import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';
import { blogRoutes } from './routes/blog.routes';
import systemRoutes from './routes/system.routes';
import uploadRoutes from './routes/upload.routes';
import { empresaRoutes, empresaAdminRoutes } from './routes/empresa.routes';
import { profissionalRoutes, profissionalAdminRoutes } from './routes/profissional.routes';
import { profissionalRpcRoutes } from './routes/profissional.rpc.routes';
import { jobRoutes, jobAdminRoutes } from './routes/job.routes';
import jobApplicationRoutes from './routes/job-application.routes';
import { testRoutes } from './routes/test.routes';

// Carrega as variáveis de ambiente
dotenv.config();

const app = express();

// Configuração CORS usando o pacote cors
app.use(cors({
  origin: '*', // Permite qualquer origem
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: '*', // Permite todos os cabeçalhos
  credentials: true, // Habilita credenciais
  preflightContinue: false, // Não continua para outras rotas em OPTIONS
  optionsSuccessStatus: 204 // Status de sucesso para OPTIONS
}));

// Middleware adicional para garantir que as requisições OPTIONS sejam tratadas corretamente
app.options('*', (req, res) => {
  res.status(200).end();
});

// Middlewares
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

// Adicionar middleware para redirecionar /professionals para /api/profissionais
app.use('/professionals', (req, res, next) => {
  console.log(`Redirecionando de /professionals para /api/profissionais - URL original: ${req.originalUrl}`);
  // Redirecionamento direto
  res.redirect(307, `/api/profissionais${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de professionals
app.use('/professionals/*', (req, res) => {
  // Extrair o caminho após /professionals/
  const path = req.originalUrl.replace('/professionals', '');
  console.log(`Redirecionando para: /api/profissionais${path}`);
  // Redirecionar para o caminho equivalente em /api/profissionais
  res.redirect(307, `/api/profissionais${path}`);
});

// Adicionar middleware para redirecionar /admin/professionals para /api/admin/profissionais
app.use('/admin/professionals', (req, res, next) => {
  console.log(`Redirecionando de /admin/professionals para /api/admin/profissionais - URL original: ${req.originalUrl}`);
  // Redirecionamento direto
  res.redirect(307, `/api/admin/profissionais${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de admin/professionals
app.use('/admin/professionals/*', (req, res) => {
  // Extrair o caminho após /admin/professionals/
  const path = req.originalUrl.replace('/admin/professionals', '');
  console.log(`Redirecionando para: /api/admin/profissionais${path}`);
  // Redirecionar para o caminho equivalente em /api/admin/profissionais
  res.redirect(307, `/api/admin/profissionais${path}`);
});

// Adicionar middleware para redirecionar /jobs para /api/vagas
app.use('/jobs', (req, res, next) => {
  console.log(`Redirecionando de /jobs para /api/vagas - URL original: ${req.originalUrl}`);
  // Redirecionamento direto
  res.redirect(307, `/api/vagas${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de jobs
app.use('/jobs/*', (req, res) => {
  // Extrair o caminho após /jobs/
  const path = req.originalUrl.replace('/jobs', '');
  console.log(`Redirecionando para: /api/vagas${path}`);
  // Redirecionar para o caminho equivalente em /api/vagas
  res.redirect(307, `/api/vagas${path}`);
});

// Adicionar middleware para redirecionar /admin/jobs para /api/admin/vagas
app.use('/admin/jobs', (req, res, next) => {
  console.log(`Redirecionando de /admin/jobs para /api/admin/vagas - URL original: ${req.originalUrl}`);
  // Redirecionamento direto
  res.redirect(307, `/api/admin/vagas${req.url}`);
});

// Rota alternativa para capturar requisições redirecionadas de admin/jobs
app.use('/admin/jobs/*', (req, res) => {
  // Extrair o caminho após /admin/jobs/
  const path = req.originalUrl.replace('/admin/jobs', '');
  console.log(`Redirecionando para: /api/admin/vagas${path}`);
  // Redirecionar para o caminho equivalente em /api/admin/vagas
  res.redirect(307, `/api/admin/vagas${path}`);
});

// Rotas
app.use('/api/blog', blogRoutes);
app.use('/api/system', systemRoutes);
app.use('/api', uploadRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/admin/empresas', empresaAdminRoutes);
app.use('/api/profissionais', profissionalRoutes);
app.use('/api/profissionais', profissionalRpcRoutes);
app.use('/api/admin/profissionais', profissionalAdminRoutes);
app.use('/api/vagas', jobRoutes);
app.use('/api/admin/vagas', jobAdminRoutes);
app.use('/api/vagas/applications', jobApplicationRoutes);
app.use('/api/test', testRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 