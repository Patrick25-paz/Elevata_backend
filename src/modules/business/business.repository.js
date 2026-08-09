import prisma from '../../config/prisma.js';

class BusinessRepository {
  /**
   * Find a business record by its unique ID.
   * @param {string} id - Business ID
   */
  async findById(id) {
    return prisma.business.findUnique({
      where: { id },
      include: { user: true }
    });
  }

  /**
   * Find a business record by the associated User ID.
   * @param {string} userId - User ID
   */
  async findByUserId(userId) {
    return prisma.business.findUnique({
      where: { userId },
      include: { user: true }
    });
  }
}

export default new BusinessRepository();
