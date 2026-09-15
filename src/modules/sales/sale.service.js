import saleRepository from './sale.repository.js';
import businessService from '../business/business.service.js';
import { AppError } from '../../utils/errors.js';

class SaleService {
  /**
   * Resolve businessId from authenticated user
   */
  async getBusinessId(userId) {
    const business = await businessService.getBusinessByUserId(userId);
    return business ? business.id : null;
  }

  /**
   * List all sales for user's business
   */
  async getSales(userId) {
    const businessId = await this.getBusinessId(userId);
    if (!businessId) return [];
    return saleRepository.findByBusinessId(businessId);
  }

  /**
   * Get single sale by ID
   */
  async getSaleById(id) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new AppError('Sale record not found', 404);
    }
    return sale;
  }

  /**
   * Record new sale with snapshot line items and stock decrement
   */
  async recordSale(userId, payload) {
    const businessId = await this.getBusinessId(userId);
    const { customer, items } = payload;

    if (!customer || customer.trim() === '') {
      throw new AppError('Customer / Buyer name is required', 400);
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one line item is required for a sale', 400);
    }

    // Validate valid quantities
    const validItems = items.filter(
      item => (item.productName || item.product) && Number(item.quantity) > 0 && Number(item.unitPrice || item.price) >= 0
    );

    if (validItems.length === 0) {
      throw new AppError('Please specify valid products with positive quantity and unit price', 400);
    }

    return saleRepository.createSale(businessId, {
      ...payload,
      items: validItems
    });
  }

  /**
   * Delete sale record
   */
  async deleteSale(id) {
    const existing = await saleRepository.findById(id);
    if (!existing) {
      throw new AppError('Sale record not found', 404);
    }
    return saleRepository.deleteSale(id);
  }
}

export default new SaleService();
