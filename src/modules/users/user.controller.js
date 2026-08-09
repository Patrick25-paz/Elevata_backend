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
}

export default new UserController();
