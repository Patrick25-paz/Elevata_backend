import prisma from '../../config/prisma.js';

class CategoryRepository {
  /**
   * List all business categories ordered by businessType name.
   */
  async findAll() {
    try {
      return await prisma.businessCategory.findMany({
        orderBy: { businessType: 'asc' }
      });
    } catch (err) {
      console.warn('Prisma businessCategory table query fallback:', err.message);
      return [];
    }
  }

  /**
   * Find a category by unique ID.
   */
  async findById(id) {
    try {
      return await prisma.businessCategory.findUnique({
        where: { id }
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Find a category by unique businessType name.
   */
  async findByBusinessType(businessType) {
    try {
      return await prisma.businessCategory.findFirst({
        where: {
          businessType: {
            equals: businessType,
            mode: 'insensitive'
          }
        }
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Create a new category in DB.
   */
  async create(data) {
    return prisma.businessCategory.create({
      data
    });
  }

  /**
   * Update category by ID.
   */
  async update(id, data) {
    return prisma.businessCategory.update({
      where: { id },
      data
    });
  }

  /**
   * Delete category by ID.
   */
  async delete(id) {
    return prisma.businessCategory.delete({
      where: { id }
    });
  }

  /**
   * Bulk insert default categories.
   */
  async createMany(items) {
    try {
      return await prisma.businessCategory.createMany({
        data: items,
        skipDuplicates: true
      });
    } catch (err) {
      console.warn('Bulk insert skipped or handled individually:', err.message);
    }
  }
}

export default new CategoryRepository();
