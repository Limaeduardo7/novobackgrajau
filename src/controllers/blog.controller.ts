import { Request, Response, NextFunction } from 'express';
import { BlogPrismaService } from '../services/blog.prisma.service';
import { AppError } from '../middlewares/errorHandler';

const blogService = new BlogPrismaService();

export class BlogController {
  // Posts
  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        ...req.query,
        validCategoryOnly: req.query.validCategoryOnly === 'true'
      };
      
      const result = await blogService.getPosts(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const validCategoryOnly = req.query.validCategoryOnly === 'true';
      const result = await blogService.getPostById(req.params.id, { validCategoryOnly });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const allowNullCategory = req.query.allowNullCategory === 'true';
      const result = await blogService.createPost(req.body, { allowNullCategory });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const allowNullCategory = req.query.allowNullCategory === 'true';
      const result = await blogService.updatePost(req.params.id, req.body, { allowNullCategory });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.deletePost(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Categories
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.getCategories();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.createCategory(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.updateCategory(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.deleteCategory(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Tags
  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.getTags();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.createTag(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.updateTag(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.deleteTag(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
} 