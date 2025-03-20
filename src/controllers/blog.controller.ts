import { Request, Response, NextFunction } from 'express';
import BlogService from '../services/blog.factory';
import { AppError } from '../middlewares/errorHandler';

export class BlogController {
  // Posts
  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const params = {
        ...req.query,
        validCategoryOnly: req.query.validCategoryOnly === 'true'
      };
      
      const result = await BlogService.getPosts(params);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const validCategoryOnly = req.query.validCategoryOnly === 'true';
      const result = await BlogService.getPostById(req.params.id, { validCategoryOnly });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const allowNullCategory = req.query.allowNullCategory === 'true';
      const result = await BlogService.createPost(req.body, { allowNullCategory });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updatePost(req: Request, res: Response, next: NextFunction) {
    try {
      const allowNullCategory = req.query.allowNullCategory === 'true';
      const result = await BlogService.updatePost(req.params.id, req.body, { allowNullCategory });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.deletePost(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Categories
  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.getCategories();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.createCategory(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.updateCategory(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.deleteCategory(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Tags
  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.getTags();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.createTag(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.updateTag(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BlogService.deleteTag(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
} 