import prisma from '../../config/prisma.js';

class AuthRepository {
  /**
   * Registers a new Business User and their Business details atomically.
   * Uses a Prisma $transaction to guarantee database consistency.
   * @param {object} userData - Core user registration data
   * @param {object} businessData - Connected business metadata
   */
  async registerBusiness(userData, businessData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          role: 'BUSINESS',
          isVerified: userData.isVerified || false,
          isActive: true
        }
      });

      // 2. Create the associated business profile
      const business = await tx.business.create({
        data: {
          userId: user.id,
          businessName: businessData.businessName,
          ownerName: businessData.ownerName,
          businessType: businessData.businessType,
          province: businessData.province,
          district: businessData.district,
          sector: businessData.sector,
          cell: businessData.cell,
          village: businessData.village,
          knownPlace: businessData.knownPlace || null,
          latitude: businessData.latitude,
          longitude: businessData.longitude
        }
      });

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        business
      };
    });
  }

  /**
   * Registers a new Financial Institution User and their profile details atomically.
   * @param {object} userData - Core user credentials
   * @param {object} fiData - Connected financial institution metadata
   */
  async registerFinancialInstitution(userData, fiData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          role: 'FINANCIAL_INSTITUTION',
          isVerified: userData.isVerified || false,
          isActive: true
        }
      });

      // 2. Create the associated financial institution profile
      const financialInstitution = await tx.financialInstitution.create({
        data: {
          userId: user.id,
          institutionName: fiData.institutionName,
          representativeName: fiData.representativeName,
          category: fiData.category,
          operatingScope: fiData.operatingScope,
          licenseNumber: fiData.licenseNumber,
          website: fiData.website || null
        }
      });

      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        financialInstitution
      };
    });
  }
}

export default new AuthRepository();
