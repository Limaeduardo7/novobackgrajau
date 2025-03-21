import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';
import { requireAuth, checkPermission } from '../middlewares/auth';

const router = Router();
const blogController = new BlogController();

// Rota de teste de autenticação
router.get('/auth-test', requireAuth, (req: any, res) => {
  res.json({ 
    success: true,
    message: 'Autenticação bem-sucedida',
    userInfo: req.auth || { message: 'No auth info available' }
  });
});

// Posts - Rotas públicas sem autenticação
router.get('/posts', blogController.getPosts);
router.get('/posts/:id', blogController.getPostById);
router.post('/posts', blogController.createPost);
router.put('/posts/:id', blogController.updatePost);
router.delete('/posts/:id', blogController.deletePost);

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