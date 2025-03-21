import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();
const blogController = new BlogController();

// Rota de debug para verificar os tokens
router.post('/debug-token', (req, res) => {
  const headers = req.headers;
  const body = req.body;
  
  console.log('====== DEBUG TOKEN ======');
  console.log('Headers:', JSON.stringify(headers, null, 2));
  console.log('Body:', JSON.stringify(body, null, 2));
  console.log('========================');
  
  // Envie informações sobre quais tokens seriam aceitos
  const adminToken = process.env.ADMIN_TOKEN;
  const formattedAdminToken = adminToken ? `Bearer ${adminToken}` : 'Não configurado';
  
  // Verificar se o token fornecido é válido
  const authHeader = req.headers.authorization || req.headers['x-authorization'];
  const isValidAdminToken = authHeader === formattedAdminToken || 
                            authHeader === adminToken ||
                            req.body.token === adminToken;
  
  // Verificar o tipo de token
  let tokenType = 'None';
  if (authHeader) {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      tokenType = 'Bearer';
    } else {
      tokenType = 'Direct';
    }
  }
  
  res.json({
    received: {
      headers: {
        authorization: headers.authorization,
        'x-authorization': headers['x-authorization'],
        'x-api-key': headers['x-api-key']
      },
      bodyToken: body.token
    },
    expectedFormat: {
      authorization: `Bearer ${adminToken?.substring(0, 15)}...`,
      'x-authorization': `Bearer ${adminToken?.substring(0, 15)}...`,
      'x-api-key': process.env.TEMPORARY_API_KEY,
      bodyToken: `${adminToken?.substring(0, 15)}...`
    },
    tokenValidation: {
      isValidToken: isValidAdminToken,
      tokenType: tokenType
    }
  });
});

// Rota de teste de autenticação
router.get('/auth-test', requireAuth, (req: any, res) => {
  res.json({ 
    success: true,
    message: 'Autenticação bem-sucedida',
    userInfo: req.auth || { message: 'No auth info available' }
  });
});

// Posts
router.get('/posts', blogController.getPosts);
router.get('/posts/:id', blogController.getPostById);
router.post('/posts', requireAuth, checkPermission('create:posts'), blogController.createPost);
router.put('/posts/:id', requireAuth, checkPermission('update:posts'), blogController.updatePost);
router.delete('/posts/:id', requireAuth, checkPermission('delete:posts'), blogController.deletePost);

// Categories
router.get('/categories', blogController.getCategories);
router.post('/categories', requireAuth, checkPermission('create:categories'), blogController.createCategory);
router.put('/categories/:id', requireAuth, checkPermission('update:categories'), blogController.updateCategory);
router.delete('/categories/:id', requireAuth, checkPermission('delete:categories'), blogController.deleteCategory);

// Tags
router.get('/tags', blogController.getTags);
router.post('/tags', requireAuth, checkPermission('create:tags'), blogController.createTag);
router.put('/tags/:id', requireAuth, checkPermission('update:tags'), blogController.updateTag);
router.delete('/tags/:id', requireAuth, checkPermission('delete:tags'), blogController.deleteTag);

export const blogRoutes = router; 