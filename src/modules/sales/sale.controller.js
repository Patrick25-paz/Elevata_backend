import saleService from './sale.service.js';
import { successResponse, createdResponse } from '../../utils/response.js';

class SaleController {
  /**
   * Get all sales
   */
  async getSales(req, res, next) {
    try {
      const sales = await saleService.getSales(req.user.id);
      return successResponse(res, 'Sales retrieved successfully', { sales });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single sale by ID
   */
  async getSaleById(req, res, next) {
    try {
      const sale = await saleService.getSaleById(req.params.id);
      return successResponse(res, 'Sale retrieved successfully', { sale });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record new sale
   */
  async recordSale(req, res, next) {
    try {
      const sale = await saleService.recordSale(req.user.id, req.body);
      return createdResponse(res, 'Sale recorded successfully', { sale });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sale
   */
  async deleteSale(req, res, next) {
    try {
      await saleService.deleteSale(req.params.id);
      return successResponse(res, 'Sale deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new SaleController();
