import categoryRepository from './category.repository.js';
import { AppError } from '../../utils/errors.js';
import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_BUSINESS_TYPES = [
  'Retail Shop',
  'Wholesale',
  'Restaurant',
  'Hotel',
  'Agriculture',
  'Manufacturing',
  'Construction',
  'Transport',
  'Education',
  'Healthcare',
  'ICT',
  'Finance',
  'Pharmacy',
  'Salon',
  'Fashion',
  'Electronics',
  'Hardware Store',
  'Supermarket',
  'Stationery',
  'Printing',
  'Other'
];

// Fallback in-memory store in case of direct DB sync initializations
let inMemoryCategories = DEFAULT_BUSINESS_TYPES.map((type, idx) => ({
  id: `cat_${idx + 1}`,
  businessType: type,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

class CategoryService {
  constructor() {
    this.hasInitialized = false;
  }

  /**
   * Initializes default categories in database if empty.
   */
  async ensureSeeded() {
    if (this.hasInitialized) return;
    try {
      const existing = await categoryRepository.findAll();
      if (existing && existing.length > 0) {
        inMemoryCategories = existing;
      } else {
        // Seed default 21 categories
        for (const type of DEFAULT_BUSINESS_TYPES) {
          try {
            await categoryRepository.create({ businessType: type });
          } catch (e) {
            // Ignore duplicate/sync logs
          }
        }
        const freshlyLoaded = await categoryRepository.findAll();
        if (freshlyLoaded && freshlyLoaded.length > 0) {
          inMemoryCategories = freshlyLoaded;
        }
      }
      this.hasInitialized = true;
    } catch (err) {
      console.warn('Category seeding initialized in memory mode:', err.message);
    }
  }

  /**
   * Retrieves all business categories.
   */
  async getAllCategories() {
    await this.ensureSeeded();
    try {
      const dbCategories = await categoryRepository.findAll();
      if (dbCategories && dbCategories.length > 0) {
        inMemoryCategories = dbCategories;
        return dbCategories;
      }
    } catch (err) {
      // Return inMemory fallback
    }
    return inMemoryCategories;
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

    // Check duplicate in memory / DB
    const existingInMemory = inMemoryCategories.find(
      (c) => c.businessType.toLowerCase() === trimmed.toLowerCase()
    );
    if (existingInMemory) {
      throw new AppError(`Category '${trimmed}' already exists`, 409);
    }

    let createdCategory = null;
    try {
      createdCategory = await categoryRepository.create({
        businessType: trimmed
      });
    } catch (err) {
      // In-memory creation fallback
      createdCategory = {
        id: uuidv4(),
        businessType: trimmed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    inMemoryCategories.push(createdCategory);
    inMemoryCategories.sort((a, b) => a.businessType.localeCompare(b.businessType));

    return createdCategory;
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

    // Check duplicate
    const duplicate = inMemoryCategories.find(
      (c) => c.id !== id && c.businessType.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      throw new AppError(`Category '${trimmed}' already exists`, 409);
    }

    let updated = null;
    try {
      updated = await categoryRepository.update(id, {
        businessType: trimmed
      });
    } catch (err) {
      // In-memory update fallback
      const idx = inMemoryCategories.findIndex((c) => c.id === id);
      if (idx === -1) {
        throw new AppError('Category not found', 404);
      }
      inMemoryCategories[idx] = {
        ...inMemoryCategories[idx],
        businessType: trimmed,
        updatedAt: new Date().toISOString()
      };
      updated = inMemoryCategories[idx];
    }

    // Update in-memory cache
    inMemoryCategories = inMemoryCategories.map((c) =>
      c.id === id ? { ...c, businessType: trimmed, updatedAt: new Date().toISOString() } : c
    );

    return updated;
  }

  /**
   * Deletes a category by ID (Admin only).
   * @param {string} id - Category ID
   */
  async deleteCategory(id) {
    const existingIndex = inMemoryCategories.findIndex((c) => c.id === id);
    if (existingIndex === -1) {
      throw new AppError('Category not found', 404);
    }

    const deletedItem = inMemoryCategories[existingIndex];

    try {
      await categoryRepository.delete(id);
    } catch (err) {
      // Handled in memory
    }

    inMemoryCategories = inMemoryCategories.filter((c) => c.id !== id);
    return { id, businessType: deletedItem.businessType };
  }
}

export default new CategoryService();
