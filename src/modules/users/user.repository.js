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

  /**
   * Update Financial Institution profile.
   * @param {string} userId - User ID
   * @param {object} data - Fields to update
   */
  async updateFinancialInstitution(userId, data) {
    return prisma.financialInstitution.update({
      where: { userId },
      data
    });
  }

  /**
   * Find all users with optional filtering and relation data.
   * @param {object} options - Search and filter options
   */
  async findAllUsers({ search, role, status } = {}) {
    const where = {};

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status === 'APPROVED') {
      where.is_approved = true;
    } else if (status === 'PENDING') {
      where.is_approved = false;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        {
          business: {
            OR: [
              { businessName: { contains: q, mode: 'insensitive' } },
              { ownerName: { contains: q, mode: 'insensitive' } },
              { businessType: { contains: q, mode: 'insensitive' } },
              { district: { contains: q, mode: 'insensitive' } },
              { province: { contains: q, mode: 'insensitive' } }
            ]
          }
        },
        {
          financialInstitution: {
            OR: [
              { institutionName: { contains: q, mode: 'insensitive' } },
              { representativeName: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
              { licenseNumber: { contains: q, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    return prisma.user.findMany({
      where,
      include: {
        business: true,
        financialInstitution: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Update user approval status (both is_approved and isPilotApproved).
   * @param {string} userId - User ID
   * @param {boolean} isApproved - Approval boolean flag
   */
  async updateApprovalStatus(userId, isApproved) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        is_approved: isApproved,
        isPilotApproved: isApproved
      },
      include: {
        business: true,
        financialInstitution: true
      }
    });
  }

  /**
   * Delete a user by ID.
   * @param {string} userId - User ID
   */
  async deleteUser(userId) {
    return prisma.user.delete({
      where: { id: userId }
    });
  }
}

export default new UserRepository();
