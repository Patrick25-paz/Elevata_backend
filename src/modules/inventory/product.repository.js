import prisma from '../../config/prisma.js';

class ProductRepository {
  /**
   * Find all products for a given business
   */
  async findByBusinessId(businessId) {
    return prisma.product.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find product by ID
   */
  async findById(id) {
    return prisma.product.findUnique({
      where: { id }
    });
  }

  /**
   * Create a new product
   */
  async create(data) {
    return prisma.product.create({
      data
    });
  }

  /**
   * Update an existing product
   */
  async update(id, data) {
    return prisma.product.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a product
   */
  async delete(id) {
    return prisma.product.delete({
      where: { id }
    });
  }

  /**
   * Adjust stock quantity of a product
   */
  async adjustStock(id, quantityChange) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return null;

    const newQuantity = Math.max(0, Number(product.stockQuantity) + Number(quantityChange));
    let status = 'In Stock';
    if (newQuantity <= 0) status = 'Out of Stock';
    else if (newQuantity <= (product.reorderLevel || 5)) status = 'Low Stock';

    return prisma.product.update({
      where: { id },
      data: {
        stockQuantity: newQuantity,
        status
      }
    });
  }

  /**
   * Create stock intake transaction with copied line items
   */
  async createStockIntake(businessId, supplier, items, invoiceNumber, notes) {
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0);

    return prisma.$transaction(async (tx) => {
      // 1. Create intake record with copied snapshot items
      const transaction = await tx.inventoryTransaction.create({
        data: {
          businessId,
          supplier: supplier || 'General Supplier',
          invoiceNumber,
          totalAmount,
          notes,
          items: {
            create: items.map(item => ({
              productId: item.productId || null,
              productName: item.productName || item.name,
              unit: item.unit || 'pcs',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice) || 0,
              total: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
            }))
          }
        },
        include: { items: true }
      });

      // 2. Increment stock quantity for existing products or create if new
      for (const item of items) {
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newQty = Number(prod.stockQuantity) + (Number(item.quantity) || 0);
            let status = 'In Stock';
            if (newQty <= 0) status = 'Out of Stock';
            else if (newQty <= (prod.reorderLevel || 5)) status = 'Low Stock';

            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: newQty,
                costPrice: Number(item.unitPrice) > 0 ? Number(item.unitPrice) : prod.costPrice,
                status
              }
            });
          }
        }
      }

      return transaction;
    });
  }

  /**
   * Find inventory transactions for a business
   */
  async findStockIntakes(businessId) {
    return prisma.inventoryTransaction.findMany({
      where: { businessId },
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export default new ProductRepository();
