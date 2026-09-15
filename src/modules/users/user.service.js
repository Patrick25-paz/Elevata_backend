import userRepository from './user.repository.js';
import { AppError } from '../../utils/errors.js';

class UserService {
  /**
   * Retrieves a user by their ID, throwing an error if the user is not found.
   * @param {string} id - User ID
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    // Omit sensitive data like password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Retrieves a user by their email, returning null if not found.
   * Used for internal lookups.
   * @param {string} email - User email
   */
  async getUserByEmail(email) {
    return userRepository.findByEmail(email);
  }

  /**
   * Retrieves all users matching filters and returns them with computed stats.
   * @param {object} filters - { search, role, status }
   */
  async getAllUsers(filters) {
    const rawUsers = await userRepository.findAllUsers(filters);
    
    // Sanitize user list (omit passwords)
    const sanitizedUsers = rawUsers.map((u) => {
      const { password, refreshToken, ...rest } = u;
      return rest;
    });

    // Compute overview metrics
    const stats = {
      total: sanitizedUsers.length,
      approved: sanitizedUsers.filter((u) => u.is_approved).length,
      pending: sanitizedUsers.filter((u) => !u.is_approved).length,
      smes: sanitizedUsers.filter((u) => u.role === 'BUSINESS').length,
      financialInstitutions: sanitizedUsers.filter((u) => u.role === 'FINANCIAL_INSTITUTION').length,
      admins: sanitizedUsers.filter((u) => u.role === 'ADMIN').length
    };

    return {
      users: sanitizedUsers,
      stats
    };
  }

  /**
   * Approve or revoke approval for a user.
   * @param {string} userId - User ID
   * @param {boolean} isApproved - Approval status
   */
  async setUserApproval(userId, isApproved) {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    const updated = await userRepository.updateApprovalStatus(userId, Boolean(isApproved));
    const { password, refreshToken, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /**
   * Delete a user by ID.
   * @param {string} userId - User ID
   * @param {string} [currentAdminId] - ID of requesting admin
   */
  async deleteUser(userId, currentAdminId) {
    if (currentAdminId && userId === currentAdminId) {
      throw new AppError('You cannot delete your own admin account while logged in.', 400);
    }

    const existing = await userRepository.findById(userId);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    await userRepository.deleteUser(userId);
    return { id: userId, email: existing.email, role: existing.role };
  }

  /**
   * Updates financial institution profile.
   * @param {string} userId - User ID
   * @param {object} data - Form data
   */
  async updateFinancialInstitutionProfile(userId, data) {
    const existing = await userRepository.findById(userId);
    if (!existing || !existing.financialInstitution) {
      throw new AppError('Financial Institution not found for this user', 404);
    }

    const { institutionName, representativeName, category, operatingScope, licenseNumber, website, phone } = data;
    const updateData = {};
    if (institutionName !== undefined) updateData.institutionName = institutionName;
    if (representativeName !== undefined) updateData.representativeName = representativeName;
    if (category !== undefined) updateData.category = category;
    if (operatingScope !== undefined) updateData.operatingScope = operatingScope;
    if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
    if (website !== undefined) updateData.website = website;

    if (phone) {
      await userRepository.update(userId, { phone });
    }

    await userRepository.updateFinancialInstitution(userId, updateData);
    return this.getUserById(userId);
  }
}

export default new UserService();
