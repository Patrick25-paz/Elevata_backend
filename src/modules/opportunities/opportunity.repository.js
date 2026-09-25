import prisma from '../../config/prisma.js';

class OpportunityRepository {
  async attachPublishers(opportunities) {
    const rows = Array.isArray(opportunities) ? opportunities : [opportunities];
    const authorIds = [...new Set(rows.map((item) => item?.authorId).filter(Boolean))];
    if (!authorIds.length) return Array.isArray(opportunities) ? rows : opportunities;

    const authors = await prisma.user.findMany({
      where: { id: { in: authorIds } },
      select: {
        id: true,
        email: true,
        phone: true,
        financialInstitution: {
          select: {
            institutionName: true,
            representativeName: true,
            category: true,
            website: true,
            operatingScope: true
          }
        }
      }
    });
    const authorMap = new Map(authors.map((author) => [author.id, author]));
    const enriched = rows.map((item) => {
      if (!item) return item;
      const author = authorMap.get(item.authorId);
      return {
        ...item,
        publisher: author ? {
          institutionName: author.financialInstitution?.institutionName || item.institution,
          representativeName: author.financialInstitution?.representativeName || null,
          category: author.financialInstitution?.category || null,
          operatingScope: author.financialInstitution?.operatingScope || null,
          email: author.email,
          phone: author.phone,
          website: author.financialInstitution?.website || null
        } : null
      };
    });
    return Array.isArray(opportunities) ? enriched : enriched[0];
  }

  /**
   * Find all opportunities with optional category, sector, status, or search filters.
   */
  async findAll(filters = {}) {
    const where = {};

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.category && filters.category !== 'All') {
      where.category = filters.category;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.authorId) {
      where.authorId = filters.authorId;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { institution: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        categoryRel: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return this.attachPublishers(opportunities);
  }

  /**
   * Find an opportunity by ID.
   */
  async findById(id) {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        categoryRel: true
      }
    });
    return this.attachPublishers(opportunity);
  }

  /**
   * Create a new opportunity.
   */
  async create(data) {
    const opportunity = await prisma.opportunity.create({
      data,
      include: {
        categoryRel: true
      }
    });
    return this.attachPublishers(opportunity);
  }

  /**
   * Update an existing opportunity by ID.
   */
  async update(id, data) {
    return prisma.opportunity.update({
      where: { id },
      data,
      include: {
        categoryRel: true
      }
    });
  }

  /**
   * Delete an opportunity by ID.
   */
  async delete(id) {
    return prisma.opportunity.delete({
      where: { id }
    });
  }

  /**
   * Increment view counter.
   */
  async incrementViews(id) {
    return prisma.opportunity.update({
      where: { id },
      data: { views: { increment: 1 } }
    });
  }
}

export default new OpportunityRepository();
