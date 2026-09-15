import productRepository from './product.repository.js';
import businessService from '../business/business.service.js';
import { AppError } from '../../utils/errors.js';

class ProductService {
  /**
   * Resolve businessId from authenticated user
   */
  async getBusinessId(userId) {
    const business = await businessService.getBusinessByUserId(userId);
    return business ? business.id : null;
  }

  /**
   * List all products for user's business
   */
  async getProducts(userId) {
    const businessId = await this.getBusinessId(userId);
    if (!businessId) {
      return [];
    }
    return productRepository.findByBusinessId(businessId);
  }

  /**
   * Get single product by ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  /**
   * Create new product
   */
  async createProduct(userId, data) {
    const businessId = await this.getBusinessId(userId);
    const {
      name,
      description,
      unit = 'pcs',
      unitPrice = 0,
      costPrice = 0,
      stockQuantity = 0,
      reorderLevel = 5,
      category = 'General',
      sku
    } = data;

    if (!name || name.trim() === '') {
      throw new AppError('Product name is required', 400);
    }

    const qty = Number(stockQuantity) || 0;
    const reorder = Number(reorderLevel) || 5;
    let status = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    return productRepository.create({
      businessId,
      name: name.trim(),
      description: description?.trim() || null,
      unit: unit || 'pcs',
      unitPrice: Number(unitPrice) || 0,
      costPrice: Number(costPrice) || 0,
      stockQuantity: qty,
      reorderLevel: reorder,
      category: category?.trim() || 'General',
      sku: sku?.trim() || null,
      status
    });
  }

  /**
   * Update existing product
   */
  async updateProduct(id, data) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    const qty = data.stockQuantity !== undefined ? Number(data.stockQuantity) : existing.stockQuantity;
    const reorder = data.reorderLevel !== undefined ? Number(data.reorderLevel) : (existing.reorderLevel || 5);
    let status = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty <= reorder) status = 'Low Stock';

    const updatePayload = {
      ...(data.name && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.unit && { unit: data.unit }),
      ...(data.unitPrice !== undefined && { unitPrice: Number(data.unitPrice) }),
      ...(data.costPrice !== undefined && { costPrice: Number(data.costPrice) }),
      ...(data.stockQuantity !== undefined && { stockQuantity: qty }),
      ...(data.reorderLevel !== undefined && { reorderLevel: reorder }),
      ...(data.category && { category: data.category.trim() }),
      ...(data.sku !== undefined && { sku: data.sku?.trim() || null }),
      status
    };

    return productRepository.update(id, updatePayload);
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    return productRepository.delete(id);
  }

  /**
   * Record Stock Intake / Restock with line items snapshot
   */
  async recordStockIntake(userId, payload) {
    const businessId = await this.getBusinessId(userId);
    const { supplier, items, invoiceNumber, notes } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one item is required for stock intake', 400);
    }

    return productRepository.createStockIntake(businessId, supplier, items, invoiceNumber, notes);
  }

  /**
   * Get all stock intake history
   */
  async getStockIntakes(userId) {
    const businessId = await this.getBusinessId(userId);
    if (!businessId) return [];
    return productRepository.findStockIntakes(businessId);
  }
}

export default new ProductService();
