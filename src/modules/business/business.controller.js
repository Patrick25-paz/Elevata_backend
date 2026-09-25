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

  /**
   * Updates the business profile and operational details.
   */
  async updateBusinessProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updatedBusiness = await businessService.updateBusinessProfile(userId, req.body);
      return successResponse(res, 'Business profile updated successfully', { business: updatedBusiness });
    } catch (error) {
      next(error);
    }
  }

  async getDashboard(req, res, next) {
    try {
      const dashboard = await businessService.getDashboardByUserId(req.user.id);
      return successResponse(res, 'Business dashboard retrieved successfully', { dashboard });
    } catch (error) {
      next(error);
    }
  }

  async getPortfolio(req, res, next) {
    try {
      const businesses = await businessService.getPortfolio();
      return successResponse(res, 'Business portfolio retrieved successfully', { businesses });
    } catch (error) {
      next(error);
    }
  }

  async getLedger(req, res, next) {
    try {
      const entries = await businessService.getLedger(req.user.id, req.query);
      return successResponse(res, 'Business ledger retrieved successfully', { entries });
    } catch (error) {
      next(error);
    }
  }

  async createLedgerEntry(req, res, next) {
    try {
      const entry = await businessService.createLedgerEntry(req.user.id, req.body);
      return successResponse(res, 'Ledger entry recorded successfully', { entry }, 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteLedgerEntry(req, res, next) {
    try {
      await businessService.deleteLedgerEntry(req.user.id, req.params.id);
      return successResponse(res, 'Ledger entry deleted successfully', {});
    } catch (error) {
      next(error);
    }
  }
}

export default new BusinessController();
