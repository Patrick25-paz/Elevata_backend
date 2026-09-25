import businessRepository from './business.repository.js';
import userRepository from '../users/user.repository.js';
import { AppError } from '../../utils/errors.js';

export const DEFAULT_SME_OPERATIONAL_DATA = {
  equipments: [],
  totalEquipmentValue: 0,
  currentAssets: 0,
  fixedAssets: 0,
  totalAssets: 0,
  shortTermLiabilities: 0,
  longTermLiabilities: 0,
  totalLiabilities: 0,
  ownerCapital: 0,
  monthlyTurnover: 0,
  annualRevenue: 0,
  grossMarginPercentage: 0,
  fullTimeEmployees: 0,
  partTimeEmployees: 0,
  totalEmployees: 0,
  monthlyPayroll: 0,
  roles: [],
  businessStage: '',
  targetMarket: '',
  primaryProducts: '',
  operationalChallenges: '',
  strategicGoals: '',
  digitizationLevel: ''
};

class BusinessService {
  _toDashboardProfile(business) {
    const series = new Map();
    const bucketFor = (dateValue) => {
      const date = new Date(dateValue);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!series.has(key)) {
        series.set(key, {
          key,
          month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          revenue: 0,
          expenses: 0,
          inflow: 0,
          outflow: 0
        });
      }
      return series.get(key);
    };

    business.sales.forEach((sale) => {
      const bucket = bucketFor(sale.createdAt);
      bucket.revenue += sale.totalAmount;
      bucket.inflow += sale.paymentStatus === 'Cancelled' ? 0 : sale.totalAmount;
    });
    business.stockIntakes.forEach((intake) => {
      const bucket = bucketFor(intake.createdAt);
      bucket.expenses += intake.totalAmount;
      bucket.outflow += intake.status === 'Cancelled' ? 0 : intake.totalAmount;
    });
    business.ledgerEntries.forEach((entry) => {
      const bucket = bucketFor(entry.occurredAt);
      if (entry.kind === 'CASH_IN') {
        bucket.inflow += entry.amount;
        bucket.revenue += entry.amount;
      } else if (entry.kind !== 'OTHER') {
        bucket.outflow += entry.amount;
        bucket.expenses += entry.amount;
      }
    });

    const monthlyData = Array.from(series.values()).sort((a, b) => a.key.localeCompare(b.key)).slice(-12)
      .map(({ key, ...item }) => item);
    const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
    const margin = totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : 0;
    const lowStock = business.products.filter((item) => item.status === 'Low Stock' || item.status === 'Out of Stock').length;
    const healthScore = Math.max(0, Math.min(100, Math.round(50 + margin * 35 + (business.sales.length ? 10 : 0) - lowStock * 2)));
    const currentBalance = monthlyData.reduce((sum, item) => sum + item.inflow - item.outflow, Number(business.operational?.openingBalance || 0));
    const currentPeriodRevenue = monthlyData.at(-1)?.revenue || 0;
    const previousPeriodRevenue = monthlyData.at(-2)?.revenue || 0;
    const revenueChange = previousPeriodRevenue > 0
      ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
      : 0;
    const healthTrend = revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'stable';

    return {
      id: business.id,
      name: business.businessName,
      ownerName: business.ownerName,
      sector: business.businessType,
      email: business.user.email,
      phone: business.user.phone,
      healthScore,
      healthTrend,
      healthTrendPercent: Math.round(Math.abs(revenueChange) * 10) / 10,
      currentBalance,
      borrowingCapacity: Math.max(0, Math.round(Math.max(0, currentBalance) * 0.6)),
      riskRating: healthScore >= 75 ? 'Low' : healthScore >= 55 ? 'Medium' : 'High',
      inventoryItems: business.products.map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.unit,
        stockLevel: product.stockQuantity,
        status: product.status,
        daysRemaining: 0,
        reorderPoint: product.reorderLevel || 0,
        unitPrice: product.unitPrice,
        costPrice: product.costPrice,
        category: product.category,
        description: product.description
      })),
      loanDetails: { status: 'None', outstandingAmount: 0, monthlyInstallment: 0, interestRate: 0, repaymentPeriodMonths: 0 },
      riskAlerts: lowStock ? [{ id: 'stock-risk', type: 'warning', text: `${lowStock} inventory item(s) require attention.` }] : [],
      monthlyData,
      sales: business.sales,
      expenses: business.ledgerEntries.filter((entry) => entry.kind === 'EXPENSE'),
      purchases: business.stockIntakes,
      cashIns: business.ledgerEntries.filter((entry) => entry.kind === 'CASH_IN'),
      cashOuts: business.ledgerEntries.filter((entry) => entry.kind === 'CASH_OUT'),
      otherActivities: business.ledgerEntries.filter((entry) => entry.kind === 'OTHER'),
      age: Math.max(0, new Date().getFullYear() - new Date(business.createdAt).getFullYear()),
      operational: business.operational || {}
    };
  }

  /**
   * Retrieves business details with rich operational metrics linked to a specific user.
   * @param {string} userId - User ID
   */
  async getBusinessByUserId(userId) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) {
      throw new AppError('Business details not found for this user', 404);
    }

    const operationalData = business.operational || { ...DEFAULT_SME_OPERATIONAL_DATA };

    return {
      ...business,
      operational: operationalData
    };
  }

  /**
   * Updates core business details and rich operational profile.
   * @param {string} userId - User ID
   * @param {object} profileData - Form data
   */
  async updateBusinessProfile(userId, profileData) {
    const existingBusiness = await businessRepository.findByUserId(userId);
    if (!existingBusiness) {
      throw new AppError('Business not found for this user', 404);
    }

    // 1. Extract core DB fields
    const {
      businessName,
      ownerName,
      businessType,
      province,
      district,
      sector,
      cell,
      village,
      knownPlace,
      latitude,
      longitude,
      phone,
      operational
    } = profileData;

    const coreUpdate = {};
    if (businessName !== undefined) coreUpdate.businessName = businessName;
    if (ownerName !== undefined) coreUpdate.ownerName = ownerName;
    if (businessType !== undefined) coreUpdate.businessType = businessType;
    if (province !== undefined) coreUpdate.province = province;
    if (district !== undefined) coreUpdate.district = district;
    if (sector !== undefined) coreUpdate.sector = sector;
    if (cell !== undefined) coreUpdate.cell = cell;
    if (village !== undefined) coreUpdate.village = village;
    if (knownPlace !== undefined) coreUpdate.knownPlace = knownPlace;
    if (latitude !== undefined) coreUpdate.latitude = latitude;
    if (longitude !== undefined) coreUpdate.longitude = longitude;

    // Update phone on User if provided
    if (phone) {
      await userRepository.update(userId, { phone });
    }

    if (operational && typeof operational === 'object') {
      coreUpdate.operational = {
        ...DEFAULT_SME_OPERATIONAL_DATA,
        ...(existingBusiness.operational || {}),
        ...operational
      };
    }

    // Update core and operational data atomically on the Business record.
    const updatedBusiness = await businessRepository.updateByUserId(userId, coreUpdate);
    const finalOperational = updatedBusiness.operational || { ...DEFAULT_SME_OPERATIONAL_DATA };

    return {
      ...updatedBusiness,
      operational: finalOperational
    };
  }

  /**
   * Internal helper to get operational profile for AI system prompt.
   */
  getOperationalData(userId) {
    return DEFAULT_SME_OPERATIONAL_DATA;
  }

  async getDashboardByUserId(userId) {
    const business = await businessRepository.findDashboardByUserId(userId);
    if (!business) throw new AppError('Business details not found for this user', 404);
    return this._toDashboardProfile(business);
  }

  async getPortfolio() {
    const businesses = await businessRepository.findPortfolio();
    return businesses.map((business) => this._toDashboardProfile(business));
  }

  async getLedger(userId, filters) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) throw new AppError('Business details not found for this user', 404);
    return businessRepository.findLedgerEntries(business.id, filters);
  }

  async createLedgerEntry(userId, payload) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) throw new AppError('Business details not found for this user', 404);
    const allowedKinds = ['CASH_IN', 'CASH_OUT', 'EXPENSE', 'OTHER'];
    if (!allowedKinds.includes(payload.kind)) throw new AppError('Invalid ledger entry type', 400);
    if (!payload.description?.trim()) throw new AppError('Description is required', 400);
    return businessRepository.createLedgerEntry(business.id, {
      kind: payload.kind,
      amount: Number(payload.amount) || 0,
      category: payload.category || null,
      description: payload.description.trim(),
      counterparty: payload.counterparty || null,
      paymentMethod: payload.paymentMethod || null,
      status: payload.status || 'Completed',
      metadata: payload.metadata || null,
      occurredAt: payload.occurredAt ? new Date(payload.occurredAt) : new Date()
    });
  }

  async deleteLedgerEntry(userId, id) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) throw new AppError('Business details not found for this user', 404);
    return businessRepository.deleteLedgerEntry(id, business.id);
  }
}

export default new BusinessService();
