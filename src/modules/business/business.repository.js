import prisma from '../../config/prisma.js';

class BusinessRepository {
  /**
   * Find a business record by its unique ID.
   * @param {string} id - Business ID
   */
  async findById(id) {
    return prisma.business.findUnique({
      where: { id },
      include: { user: true }
    });
  }

  /**
   * Find a business record by the associated User ID.
   * @param {string} userId - User ID
   */
  async findByUserId(userId) {
    return prisma.business.findUnique({
      where: { userId },
      include: { user: true }
    });
  }

  /**
   * Update a business record by User ID.
   * @param {string} userId - User ID
   * @param {object} data - Fields to update
   */
  async updateByUserId(userId, data) {
    return prisma.business.update({
      where: { userId },
      data,
      include: { user: true }
    });
  }

  async findDashboardByUserId(userId) {
    return prisma.business.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, phone: true } },
        products: { orderBy: { createdAt: 'desc' } },
        sales: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        stockIntakes: { include: { items: true }, orderBy: { createdAt: 'desc' } },
        ledgerEntries: { orderBy: { occurredAt: 'desc' } }
      }
    });
  }

  async findPortfolio() {
    return prisma.business.findMany({
      include: {
        user: { select: { email: true, phone: true, isActive: true, is_approved: true } },
        products: true,
        sales: { include: { items: true } },
        stockIntakes: { include: { items: true } },
        ledgerEntries: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createLedgerEntry(businessId, data) {
    return prisma.businessLedgerEntry.create({ data: { ...data, businessId } });
  }

  async findLedgerEntries(businessId, filters = {}) {
    const where = { businessId };
    if (filters.kind) where.kind = filters.kind;
    if (filters.from || filters.to) {
      where.occurredAt = {};
      if (filters.from) where.occurredAt.gte = new Date(filters.from);
      if (filters.to) where.occurredAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
    return prisma.businessLedgerEntry.findMany({ where, orderBy: { occurredAt: 'desc' } });
  }

  async deleteLedgerEntry(id, businessId) {
    return prisma.businessLedgerEntry.deleteMany({ where: { id, businessId } });
  }
}

export default new BusinessRepository();
