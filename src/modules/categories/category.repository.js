import prisma from '../../config/prisma.js';

class CategoryRepository {
  /**
   * List all business categories ordered by businessType name.
   */
  async findAll() {
    return prisma.businessCategory.findMany({
      orderBy: { businessType: 'asc' }
    });
  }

  /**
   * Find a category by unique ID.
   */
  async findById(id) {
    return prisma.businessCategory.findUnique({
      where: { id }
    });
  }

  /**
   * Find a category by unique businessType name.
   */
  async findByBusinessType(businessType) {
    return prisma.businessCategory.findFirst({
      where: {
        businessType: {
          equals: businessType,
          mode: 'insensitive'
        }
      }
    });
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
}

export default new CategoryRepository();
