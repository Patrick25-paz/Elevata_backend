import { Prisma } from '@prisma/client';
import categoryRepository from './category.repository.js';
import { AppError } from '../../utils/errors.js';
import { BASE_TEMPLATE, DEFAULT_TEMPLATES, resolveTemplate, validateTemplateConfig } from './categoryTemplates.js';

/** Category row as sent to clients, with its fully resolved template. */
const present = (category) => {
  const template = resolveTemplate(category.businessType, category.config);
  return {
    id: category.id,
    businessType: category.businessType,
    cat_name: category.businessType, // legacy alias used by older screens
    description: category.description || template.description,
    icon: category.icon || template.icon,
    isActive: category.isActive !== false,
    sortOrder: category.sortOrder ?? 0,
    hasCustomConfig: Boolean(category.config && Object.keys(category.config).length),
    config: category.config || null,
    template,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt
  };
};

const pickEditable = (payload = {}) => {
  const data = {};
  if (payload.description !== undefined) data.description = String(payload.description || '').trim() || null;
  if (payload.icon !== undefined) data.icon = String(payload.icon || '').trim() || null;
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);
  if (payload.sortOrder !== undefined) data.sortOrder = Number.parseInt(payload.sortOrder, 10) || 0;
  if (payload.config !== undefined) {
    try {
      const validated = validateTemplateConfig(payload.config);
      // null / empty resets the category to its built-in default template.
      data.config = validated && Object.keys(validated).length ? validated : Prisma.DbNull;
    } catch (error) {
      throw new AppError(`Invalid template: ${error.message}`, 400);
    }
  }
  return data;
};

class CategoryService {
  /**
   * Lists categories with resolved templates.
   * Inactive categories are hidden unless includeInactive is set (admin screens).
   */
  async getAllCategories({ includeInactive = false } = {}) {
    const rows = await categoryRepository.findAll();
    return rows.filter((row) => includeInactive || row.isActive !== false).map(present);
  }

  /**
   * Resolves the template for any business type, even one with no category row
   * (older businesses), falling back to the generic template.
   */
  async getTemplateFor(businessType) {
    const row = businessType ? await categoryRepository.findByBusinessType(String(businessType).trim()) : null;
    if (row) return present(row);
    return {
      id: null,
      businessType: businessType || null,
      description: BASE_TEMPLATE.description,
      icon: BASE_TEMPLATE.icon,
      isActive: false,
      hasCustomConfig: false,
      config: null,
      template: resolveTemplate(businessType, null)
    };
  }

  /** Built-in defaults, so the admin screen can show what "reset" would restore. */
  getBuiltInDefaults() {
    return { base: BASE_TEMPLATE, byType: DEFAULT_TEMPLATES };
  }

  async createCategory(businessType, payload = {}) {
    if (!businessType || !businessType.trim()) {
      throw new AppError('Business type category name is required', 400);
    }
    const trimmed = businessType.trim();
    const existing = await categoryRepository.findByBusinessType(trimmed);
    if (existing) {
      throw new AppError(`Category '${trimmed}' already exists`, 409);
    }
    const created = await categoryRepository.create({ businessType: trimmed, ...pickEditable(payload) });
    return present(created);
  }

  async updateCategory(id, businessType, payload = {}) {
    const existing = await categoryRepository.findById(id);
    if (!existing) throw new AppError('Category not found', 404);

    const data = pickEditable(payload);
    if (businessType !== undefined) {
      const trimmed = String(businessType || '').trim();
      if (!trimmed) throw new AppError('Business type category name is required', 400);
      const duplicate = await categoryRepository.findByBusinessType(trimmed);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Category '${trimmed}' already exists`, 409);
      }
      data.businessType = trimmed;
    }
    const updated = await categoryRepository.update(id, data);
    return present(updated);
  }

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
