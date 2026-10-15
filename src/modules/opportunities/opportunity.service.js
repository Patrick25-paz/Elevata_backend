import opportunityRepository from './opportunity.repository.js';
import categoryRepository from '../categories/category.repository.js';

class OpportunityService {

  /**
   * Get all opportunities.
   */
  async getAllOpportunities(filters = {}) {
    return opportunityRepository.findAll(filters);
  }

  /**
   * Get a single opportunity by ID.
   */
  async getOpportunityById(id) {
    const item = await opportunityRepository.findById(id);
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
      const matchingCat = await categoryRepository.findByBusinessType(finalSectors[0]);
      if (matchingCat) {
        finalCategoryId = matchingCat.id;
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
      metadata: {
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
        guideDocument: payload.guideDocument || metadata?.guideDocument || null,
        videoUrl: payload.videoUrl || metadata?.videoUrl || null
      },
      authorId: user?.id || null,
      views: 0,
      saved: 0,
      applicationsCount: 0,
      status: 'Active'
    };

    return opportunityRepository.create(newOppData);
  }

  /**
   * Update an opportunity.
   */
  async updateOpportunity(id, payload) {
    const existing = await opportunityRepository.findById(id);
    if (!existing) {
      const error = new Error('Opportunity not found');
      error.statusCode = 404;
      throw error;
    }

    const {
      guideDocument,
      videoUrl,
      metadata,
      ...directFields
    } = payload;

    const updateData = {
      ...directFields,
      ...(guideDocument !== undefined || videoUrl !== undefined || metadata !== undefined
        ? {
            metadata: {
              ...(existing.metadata && typeof existing.metadata === 'object' ? existing.metadata : {}),
              ...(metadata && typeof metadata === 'object' ? metadata : {}),
              ...(guideDocument !== undefined ? { guideDocument } : {}),
              ...(videoUrl !== undefined ? { videoUrl } : {})
            }
          }
        : {})
    };

    return opportunityRepository.update(id, updateData);
  }

  /**
   * Delete an opportunity.
   */
  async deleteOpportunity(id) {
    await opportunityRepository.delete(id);
    return { success: true, id };
  }
}

export default new OpportunityService();
