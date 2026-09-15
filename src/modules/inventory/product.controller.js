import productService from './product.service.js';
import { successResponse, createdResponse } from '../../utils/response.js';

class ProductController {
  /**
   * Get all products for user's business
   */
  async getProducts(req, res, next) {
    try {
      const products = await productService.getProducts(req.user.id);
      return successResponse(res, 'Products retrieved successfully', { products });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single product by ID
   */
  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      return successResponse(res, 'Product retrieved successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new product
   */
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.user.id, req.body);
      return createdResponse(res, 'Product created successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   */
  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return successResponse(res, 'Product updated successfully', { product });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      return successResponse(res, 'Product deleted successfully', null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record stock intake / supplier batch
   */
  async recordStockIntake(req, res, next) {
    try {
      const intake = await productService.recordStockIntake(req.user.id, req.body);
      return createdResponse(res, 'Stock intake recorded successfully', { intake });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock intake history
   */
  async getStockIntakes(req, res, next) {
    try {
      const intakes = await productService.getStockIntakes(req.user.id);
      return successResponse(res, 'Stock intakes retrieved successfully', { intakes });
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
