import prisma from '../../config/prisma.js';

class UserRepository {
  /**
   * Find a user by their unique ID, including the related business details.
   * @param {string} id - User ID
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { business: true, financialInstitution: true }
    });
  }

  /**
   * Find a user by their unique email.
   * @param {string} email - User email
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { business: true, financialInstitution: true }
    });
  }

  /**
   * Update the user's stored refresh token.
   * @param {string} userId - User ID
   * @param {string|null} refreshToken - JWT Refresh token (or null to revoke)
   */
  async updateRefreshToken(userId, refreshToken) {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken }
    });
  }

  /**
   * General update of user details.
   * @param {string} userId - User ID
   * @param {object} updateData - Fields to update
   */
  async update(userId, updateData) {
    return prisma.user.update({
      where: { id: userId },
      data: updateData
    });
  }
}

export default new UserRepository();
