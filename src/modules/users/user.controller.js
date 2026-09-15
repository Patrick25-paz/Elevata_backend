import userService from './user.service.js';
import { successResponse } from '../../utils/response.js';

class UserController {
  /**
   * Get authenticated user profile details.
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await userService.getUserById(userId);
      return successResponse(res, 'Profile retrieved successfully', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: List all registered users with filters and overview metrics.
   */
  async getAllUsers(req, res, next) {
    try {
      const { search, role, status } = req.query;
      const result = await userService.getAllUsers({ search, role, status });
      return successResponse(res, 'Users retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Approve or revoke approval for a user.
   */
  async approveUser(req, res, next) {
    try {
      const { id } = req.params;
      const { is_approved = true } = req.body;
      const updatedUser = await userService.setUserApproval(id, is_approved);
      const actionText = is_approved ? 'approved' : 'unapproved';
      return successResponse(res, `User ${actionText} successfully`, { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Delete user account.
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const currentAdminId = req.user?.id;
      const result = await userService.deleteUser(id, currentAdminId);
      return successResponse(res, 'User deleted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Updates financial institution profile of logged in user.
   */
  async updateFinancialInstitutionProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updatedUser = await userService.updateFinancialInstitutionProfile(userId, req.body);
      return successResponse(res, 'Institution profile updated successfully', { user: updatedUser });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
