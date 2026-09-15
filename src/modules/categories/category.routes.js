import { Router } from 'express';
import categoryController from './category.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Public / Authenticated retrieval of business categories
router.get('/', (req, res, next) => categoryController.getCategories(req, res, next));

// Admin CRUD operations
router.post('/admin', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.createCategory(req, res, next));
router.put('/admin/:id', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.updateCategory(req, res, next));
router.delete('/admin/:id', authenticate, authorize('ADMIN'), (req, res, next) => categoryController.deleteCategory(req, res, next));

export default router;
