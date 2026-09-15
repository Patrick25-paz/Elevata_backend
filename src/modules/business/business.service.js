import businessRepository from './business.repository.js';
import userRepository from '../users/user.repository.js';
import { AppError } from '../../utils/errors.js';

// In-memory store for rich operational business profile metadata
const operationalProfileStore = new Map();

export const DEFAULT_SME_OPERATIONAL_DATA = {
  // Operational Equipments & Machinery
  equipments: [
    { id: 'eq_1', name: 'Cloud POS Terminal & Barcode Scanner', category: 'Technology', value: 650000, condition: 'Operational' },
    { id: 'eq_2', name: 'Commercial Grade Refrigerator & Cold Shelf', category: 'Storage', value: 2400000, condition: 'Operational' },
    { id: 'eq_3', name: 'Delivery Motorcycle (150cc)', category: 'Logistics', value: 1800000, condition: 'Operational' },
    { id: 'eq_4', name: 'Diesel Backup Generator (5kVA)', category: 'Power', value: 1200000, condition: 'Operational' }
  ],
  totalEquipmentValue: 6050000,

  // Balance Sheet & Capital
  currentAssets: 8500000,      // Cash + stock + accounts receivable
  fixedAssets: 9500000,        // Equipment + vehicle + fixtures
  totalAssets: 18000000,
  shortTermLiabilities: 1800000, // Supplier credit
  longTermLiabilities: 1700000,  // Microfinance debt
  totalLiabilities: 3500000,
  ownerCapital: 14500000,      // Equity (Assets - Liabilities)
  monthlyTurnover: 4200000,
  annualRevenue: 50400000,
  grossMarginPercentage: 28,

  // Human Capital & Payroll
  fullTimeEmployees: 4,
  partTimeEmployees: 2,
  totalEmployees: 6,
  monthlyPayroll: 750000,
  roles: ['Store Manager', 'Sales Attendants (2)', 'Logistics Rider', 'Accountant (Part-time)'],

  // Strategic Positioning & Categorization
  businessStage: 'Growth / Scaling',
  targetMarket: 'Retail Consumers, Local Offices & Small Catering Businesses',
  primaryProducts: 'Fast-Moving Consumer Goods (FMCG), Packaged Groceries, Fresh Produce',
  operationalChallenges: 'Working capital constraints for bulk discount supplier orders and transport fuel costs',
  strategicGoals: 'Expand inventory variety, secure 5M RWF working capital facility, and launch direct B2B supply contracts',
  digitizationLevel: 'Medium (POS & Mobile Money enabled)'
};

class BusinessService {
  /**
   * Retrieves business details with rich operational metrics linked to a specific user.
   * @param {string} userId - User ID
   */
  async getBusinessByUserId(userId) {
    const business = await businessRepository.findByUserId(userId);
    if (!business) {
      throw new AppError('Business details not found for this user', 404);
    }

    const operationalData = operationalProfileStore.get(userId) || { ...DEFAULT_SME_OPERATIONAL_DATA };

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

    // Update Business record in DB
    const updatedBusiness = await businessRepository.updateByUserId(userId, coreUpdate);

    // 2. Save/Update rich operational data
    if (operational && typeof operational === 'object') {
      const currentOp = operationalProfileStore.get(userId) || { ...DEFAULT_SME_OPERATIONAL_DATA };
      const mergedOp = { ...currentOp, ...operational };
      operationalProfileStore.set(userId, mergedOp);
    }

    const finalOperational = operationalProfileStore.get(userId) || { ...DEFAULT_SME_OPERATIONAL_DATA };

    return {
      ...updatedBusiness,
      operational: finalOperational
    };
  }

  /**
   * Internal helper to get operational profile for AI system prompt.
   */
  getOperationalData(userId) {
    return operationalProfileStore.get(userId) || DEFAULT_SME_OPERATIONAL_DATA;
  }
}

export default new BusinessService();
