import categoryService from './category.service.js';
import { successResponse } from '../../utils/response.js';

const EDITABLE = ['description', 'icon', 'config', 'isActive', 'sortOrder'];
const editableFields = (body = {}) =>
  Object.fromEntries(EDITABLE.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

class CategoryController {
  /** Public: active categories with resolved templates (used by registration). */
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(res, 'Categories retrieved successfully', { categories });
    } catch (error) {
      next(error);
    }
  }

  /** Public: template for one business type (falls back to the generic template). */
  async getTemplate(req, res, next) {
    try {
      const category = await categoryService.getTemplateFor(req.query.businessType);
      return successResponse(res, 'Category template retrieved successfully', { category });
    } catch (error) {
      next(error);
    }
  }

  /** Admin: all categories including inactive ones. */
  async getAdminCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories({ includeInactive: true });
      return successResponse(res, 'Categories retrieved successfully', { categories, defaults: categoryService.getBuiltInDefaults() });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { businessType, cat_name } = req.body;
      const category = await categoryService.createCategory(businessType || cat_name, editableFields(req.body));
      return successResponse(res, 'Business category created successfully', { category }, 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { businessType, cat_name } = req.body;
      const category = await categoryService.updateCategory(id, businessType ?? cat_name, editableFields(req.body));
      return successResponse(res, 'Business category updated successfully', { category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const result = await categoryService.deleteCategory(id);
      return successResponse(res, 'Business category deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
