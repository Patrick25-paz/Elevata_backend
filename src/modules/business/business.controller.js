import businessService from './business.service.js';
import { successResponse } from '../../utils/response.js';

class BusinessController {
  /**
   * Retrieves the business information of the authenticated user.
   */
  async getMyBusiness(req, res, next) {
    try {
      const userId = req.user.id;
      const business = await businessService.getBusinessByUserId(userId);
      return successResponse(res, 'Business details retrieved successfully', { business });
    } catch (error) {
      next(error);
    }
  }
}

export default new BusinessController();
