import prisma from '../../config/prisma.js';

class SaleRepository {
  /**
   * Find all sales for a business
   */
  async findByBusinessId(businessId) {
    return prisma.saleTransaction.findMany({
      where: { businessId },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Find single sale by ID
   */
  async findById(id) {
    return prisma.saleTransaction.findUnique({
      where: { id },
      include: { items: true }
    });
  }

  /**
   * Create sale transaction with copied line items snapshot and stock decrement
   */
  async createSale(businessId, payload) {
    const { customer, customerContact, invoiceNumber, paymentStatus, paymentMethod, notes, items } = payload;

    const totalAmount = items.reduce(
      (sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)),
      0
    );

    return prisma.$transaction(async (tx) => {
      // 1. Create Sale record with copied snapshot line items
      const sale = await tx.saleTransaction.create({
        data: {
          businessId,
          customer: customer || 'General Buyer',
          customerContact: customerContact || null,
          invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
          totalAmount,
          paymentStatus: paymentStatus || 'Completed',
          paymentMethod: paymentMethod || 'Cash',
          notes: notes || null,
          items: {
            create: items.map(item => ({
              productId: item.productId || null,
              productName: item.productName || item.product,
              unit: item.unit || 'pcs',
              quantity: Number(item.quantity) || 1,
              unitPrice: Number(item.unitPrice || item.price) || 0,
              total: (Number(item.quantity) || 1) * (Number(item.unitPrice || item.price) || 0)
            }))
          }
        },
        include: { items: true }
      });

      // 2. Decrement stock for products if productId was provided
      for (const item of items) {
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newQty = Math.max(0, Number(prod.stockQuantity) - (Number(item.quantity) || 0));
            let status = 'In Stock';
            if (newQty <= 0) status = 'Out of Stock';
            else if (newQty <= (prod.reorderLevel || 5)) status = 'Low Stock';

            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: newQty,
                status
              }
            });
          }
        }
      }

      return sale;
    });
  }

  /**
   * Delete sale record
   */
  async deleteSale(id) {
    return prisma.saleTransaction.delete({
      where: { id }
    });
  }
}

export default new SaleRepository();
