import businessRepository from './business.repository.js';
import { AppError } from '../../utils/errors.js';

class BusinessService {
  /**
   * Retrieves business details linked to a specific user.
   * @param {string} userId - User ID
   */
  async getBusinessByUserId(userId) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) {
      throw new AppError('Business details not found for this user', 404);
    }
    return business;
  }
}

export default new BusinessService();
