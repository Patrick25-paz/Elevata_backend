import categoryService from './category.service.js';
import { successResponse } from '../../utils/response.js';

class CategoryController {
  /**
   * Retrieves all business categories.
   */
  async getCategories(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return successResponse(res, 'Categories retrieved successfully', { categories });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Creates a new business category.
   */
  async createCategory(req, res, next) {
    try {
      const { businessType, cat_name } = req.body;
      const type = businessType || cat_name;
      const category = await categoryService.createCategory(type);
      return successResponse(res, 'Business category created successfully', { category }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Updates an existing business category.
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { businessType, cat_name } = req.body;
      const type = businessType || cat_name;
      const category = await categoryService.updateCategory(id, type);
      return successResponse(res, 'Business category updated successfully', { category });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Deletes a business category.
   */
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
