import prisma from '../../config/prisma.js';

class OpportunityRepository {
  /**
   * Find all opportunities with optional category, sector, status, or search filters.
   */
  async findAll(filters = {}) {
    try {
      const where = {};

      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.category && filters.category !== 'All') {
        where.category = filters.category;
      }
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }
      if (filters.authorId) {
        where.authorId = filters.authorId;
      }
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { institution: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      return await prisma.opportunity.findMany({
        where,
        include: {
          categoryRel: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (err) {
      console.warn('Prisma opportunity query fallback:', err.message);
      return null;
    }
  }

  /**
   * Find an opportunity by ID.
   */
  async findById(id) {
    try {
      return await prisma.opportunity.findUnique({
        where: { id },
        include: {
          categoryRel: true
        }
      });
    } catch (err) {
      console.warn('Prisma opportunity findById fallback:', err.message);
      return null;
    }
  }

  /**
   * Create a new opportunity.
   */
  async create(data) {
    return prisma.opportunity.create({
      data,
      include: {
        categoryRel: true
      }
    });
  }

  /**
   * Update an existing opportunity by ID.
   */
  async update(id, data) {
    return prisma.opportunity.update({
      where: { id },
      data,
      include: {
        categoryRel: true
      }
    });
  }

  /**
   * Delete an opportunity by ID.
   */
  async delete(id) {
    return prisma.opportunity.delete({
      where: { id }
    });
  }

  /**
   * Increment view counter.
   */
  async incrementViews(id) {
    try {
      return await prisma.opportunity.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    } catch (err) {
      return null;
    }
  }
}

export default new OpportunityRepository();
