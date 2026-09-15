import opportunityRepository from './opportunity.repository.js';
import categoryRepository from '../categories/category.repository.js';

const INITIAL_OPPORTUNITIES = [
  {
    id: 'opp-1',
    title: 'Business Expansion Loan',
    institution: 'BPR Bank',
    category: 'Loan',
    description: 'Low-interest credit facility designed to scale SME operations, purchase inventory, or upgrade machinery. Suitable for medium sized businesses with regular monthly sales.',
    benefits: '12% p.a. fixed interest, 3 months grace period, fully digital application and fast disbursement.',
    deadline: '2026-08-30',
    maxFunding: '50,000,000 FRW',
    sectors: ['Retail Shop', 'Agriculture', 'ICT', 'Transport'],
    minAge: 2,
    minRevenue: 4000000,
    minHealthScore: 70,
    minReadinessScore: 75,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: false,
    requiredDocs: ['Business License', 'Tax Clearance Certificate', 'Q2 Financial Statements'],
    views: 142,
    saved: 28,
    applicationsCount: 3,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'opp-2',
    title: 'Agri-Tech Youth Innovation Grant',
    institution: 'Access Bank Rwanda',
    category: 'Grant',
    description: 'Non-repayable financial support grant specifically allocated to smallholders and modern farming enterprises applying sustainable methods and technology in Rwanda.',
    benefits: '100% equity-free capital, expert business coaching for 6 months, priority supply chain linkages.',
    deadline: '2026-09-15',
    maxFunding: '25,000,000 FRW',
    sectors: ['Agriculture', 'Manufacturing', 'Wholesale'],
    minAge: 1,
    minRevenue: 1500000,
    minHealthScore: 60,
    minReadinessScore: 65,
    registrationRequired: true,
    taxCompliance: false,
    collateralRequired: false,
    requiredDocs: ['Project Proposal', 'National ID of Founders', 'Land/Facility Proof'],
    views: 98,
    saved: 42,
    applicationsCount: 8,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'opp-3',
    title: 'Smart POS & Working Capital Advance',
    institution: 'BK (Bank of Kigali)',
    category: 'Digital Solution',
    description: 'Integrated digital revenue-based financing bundled with contactless POS payment terminals to streamline sales reconciliation and automatic daily repayment.',
    benefits: 'Instant approval within 24h, zero upfront collateral, cash-flow aligned micro-repayments.',
    deadline: '2026-12-31',
    maxFunding: '15,000,000 FRW',
    sectors: ['Retail Shop', 'Restaurant', 'Hotel', 'Electronics', 'Supermarket'],
    minAge: 1,
    minRevenue: 2000000,
    minHealthScore: 65,
    minReadinessScore: 70,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: false,
    requiredDocs: ['6-Month Mobile Money or Bank Statement', 'RDB Registration'],
    views: 210,
    saved: 55,
    applicationsCount: 14,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'opp-4',
    title: 'Women Entrepreneurship Growth Facility',
    institution: 'Urwego Bank',
    category: 'Loan',
    description: 'Tailored micro-loan with preferential interest rates and group guarantee mechanisms aimed at empowering women-led commercial businesses in rural and urban sectors.',
    benefits: '9% subsidized interest rate, financial literacy workshop included, flexible 36-month repayment.',
    deadline: '2026-10-10',
    maxFunding: '30,000,000 FRW',
    sectors: ['Fashion', 'Salon', 'Retail Shop', 'Wholesale', 'Agriculture'],
    minAge: 1,
    minRevenue: 1000000,
    minHealthScore: 55,
    minReadinessScore: 60,
    registrationRequired: false,
    taxCompliance: false,
    collateralRequired: false,
    requiredDocs: ['National ID', 'Proof of Business Activity'],
    views: 185,
    saved: 67,
    applicationsCount: 11,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'opp-5',
    title: 'Clean Energy & Solar Micro-Finance',
    institution: 'Equity Bank Rwanda',
    category: 'Loan',
    description: 'Targeted equipment finance loan for enterprises transitioning to solar energy installations, solar irrigation, and energy-efficient commercial appliances.',
    benefits: 'Up to 80% equipment cost covered, direct vendor settlement, 4-year tenure.',
    deadline: '2026-11-20',
    maxFunding: '40,000,000 FRW',
    sectors: ['Agriculture', 'Manufacturing', 'Hotel', 'Healthcare'],
    minAge: 2,
    minRevenue: 3000000,
    minHealthScore: 70,
    minReadinessScore: 70,
    registrationRequired: true,
    taxCompliance: true,
    collateralRequired: true,
    requiredDocs: ['Vendor Proforma Invoice', 'RDB Certificate', 'Audited Accounts'],
    views: 76,
    saved: 19,
    applicationsCount: 2,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

class OpportunityService {
  constructor() {
    this.inMemoryOpportunities = [...INITIAL_OPPORTUNITIES];
  }

  /**
   * Get all opportunities with fallback.
   */
  async getAllOpportunities(filters = {}) {
    try {
      const dbOpps = await opportunityRepository.findAll(filters);
      if (dbOpps && dbOpps.length > 0) {
        return dbOpps;
      }
    } catch (e) {
      console.warn('DB opportunity list failed, falling back to memory store:', e.message);
    }

    // Apply memory filters
    let results = [...this.inMemoryOpportunities];
    if (filters.category && filters.category !== 'All') {
      results = results.filter(o => (o.category || '').toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.categoryId) {
      results = results.filter(o => o.categoryId === filters.categoryId);
    }
    if (filters.status) {
      results = results.filter(o => o.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(o =>
        (o.title || '').toLowerCase().includes(q) ||
        (o.institution || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Get a single opportunity by ID.
   */
  async getOpportunityById(id) {
    try {
      const dbOpp = await opportunityRepository.findById(id);
      if (dbOpp) return dbOpp;
    } catch (e) {
      // Fallback
    }

    const item = this.inMemoryOpportunities.find(o => o.id === id);
    if (!item) {
      const err = new Error('Opportunity not found');
      err.statusCode = 404;
      throw err;
    }
    return item;
  }

  /**
   * Create a new opportunity in the database.
   */
  async createOpportunity(payload, user = {}) {
    const {
      title,
      institution,
      category,
      description,
      benefits,
      deadline,
      maxFunding,
      sectors,
      categoryId,
      minAge,
      minRevenue,
      minHealthScore,
      minReadinessScore,
      registrationRequired,
      taxCompliance,
      collateralRequired,
      requiredDocs,
      metadata
    } = payload;

    if (!title || !institution || !category || !deadline) {
      const error = new Error('Title, institution, category, and deadline are required');
      error.statusCode = 400;
      throw error;
    }

    // Ensure categoryId is resolved if sector is provided
    let finalCategoryId = categoryId || null;
    let finalSectors = Array.isArray(sectors) ? sectors : [];

    if (!finalCategoryId && finalSectors.length > 0) {
      try {
        const matchingCat = await categoryRepository.findByBusinessType(finalSectors[0]);
        if (matchingCat) {
          finalCategoryId = matchingCat.id;
        }
      } catch (e) {
        // Ignore resolution error
      }
    }

    const newOppData = {
      title: title.trim(),
      institution: institution.trim(),
      category: category.trim(),
      description: description ? description.trim() : `${category} opportunity for growing businesses.`,
      benefits: benefits ? benefits.trim() : null,
      deadline,
      maxFunding: maxFunding || 'Flexible',
      sectors: finalSectors,
      categoryId: finalCategoryId,
      minAge: Number(minAge) || 0,
      minRevenue: Number(minRevenue) || 0,
      minHealthScore: Number(minHealthScore) || 0,
      minReadinessScore: Number(minReadinessScore) || 0,
      registrationRequired: Boolean(registrationRequired),
      taxCompliance: Boolean(taxCompliance),
      collateralRequired: Boolean(collateralRequired),
      requiredDocs: Array.isArray(requiredDocs) ? requiredDocs : [],
      metadata: metadata || null,
      authorId: user?.id || null,
      views: 0,
      saved: 0,
      applicationsCount: 0,
      status: 'Active'
    };

    try {
      const created = await opportunityRepository.create(newOppData);
      this.inMemoryOpportunities.unshift(created);
      return created;
    } catch (err) {
      console.warn('Prisma create opportunity fallback to in-memory:', err.message);
      const fallbackItem = {
        id: `opp-${Date.now()}`,
        ...newOppData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.inMemoryOpportunities.unshift(fallbackItem);
      return fallbackItem;
    }
  }

  /**
   * Update an opportunity.
   */
  async updateOpportunity(id, payload) {
    try {
      const updated = await opportunityRepository.update(id, payload);
      const idx = this.inMemoryOpportunities.findIndex(o => o.id === id);
      if (idx !== -1) {
        this.inMemoryOpportunities[idx] = { ...this.inMemoryOpportunities[idx], ...updated };
      }
      return updated;
    } catch (err) {
      const idx = this.inMemoryOpportunities.findIndex(o => o.id === id);
      if (idx !== -1) {
        this.inMemoryOpportunities[idx] = {
          ...this.inMemoryOpportunities[idx],
          ...payload,
          updatedAt: new Date().toISOString()
        };
        return this.inMemoryOpportunities[idx];
      }
      const error = new Error('Opportunity not found');
      error.statusCode = 404;
      throw error;
    }
  }

  /**
   * Delete an opportunity.
   */
  async deleteOpportunity(id) {
    try {
      await opportunityRepository.delete(id);
    } catch (err) {
      // In memory fallback
    }
    this.inMemoryOpportunities = this.inMemoryOpportunities.filter(o => o.id !== id);
    return { success: true, id };
  }
}

export default new OpportunityService();
