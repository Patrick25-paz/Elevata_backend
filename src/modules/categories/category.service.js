import categoryRepository from './category.repository.js';
import { AppError } from '../../utils/errors.js';

class CategoryService {
  /**
   * Retrieves all business categories.
   */
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  /**
   * Creates a new business category (Admin only).
   * @param {string} businessType - Category name
   */
  async createCategory(businessType) {
    if (!businessType || !businessType.trim()) {
      throw new AppError('Business type category name is required', 400);
    }

    const trimmed = businessType.trim();

    const existing = await categoryRepository.findByBusinessType(trimmed);
    if (existing) {
      throw new AppError(`Category '${trimmed}' already exists`, 409);
    }

    return categoryRepository.create({ businessType: trimmed });
  }

  /**
   * Updates an existing category (Admin only).
   * @param {string} id - Category ID
   * @param {string} businessType - New category name
   */
  async updateCategory(id, businessType) {
    if (!businessType || !businessType.trim()) {
      throw new AppError('Business type category name is required', 400);
    }

    const trimmed = businessType.trim();

    const duplicate = await categoryRepository.findByBusinessType(trimmed);
    if (duplicate && duplicate.id !== id) {
      throw new AppError(`Category '${trimmed}' already exists`, 409);
    }

    return categoryRepository.update(id, { businessType: trimmed });
  }

  /**
   * Deletes a category by ID (Admin only).
   * @param {string} id - Category ID
   */
  async deleteCategory(id) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    const deleted = await categoryRepository.delete(id);
    return { id: deleted.id, businessType: deleted.businessType };
  }
}

export default new CategoryService();
