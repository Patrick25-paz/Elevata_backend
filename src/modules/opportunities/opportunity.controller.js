import opportunityService from './opportunity.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import prisma from '../../config/prisma.js';

class OpportunityController {
  /**
   * GET /api/opportunities
   */
  async getOpportunities(req, res) {
    try {
      const { category, categoryId, status, search } = req.query;
      const opportunities = await opportunityService.getAllOpportunities({
        category,
        categoryId,
        status,
        search
      });

      return successResponse(res, 'Opportunities retrieved successfully', opportunities);
    } catch (err) {
      console.error('getOpportunities error:', err);
      return errorResponse(res, err.message || 'Failed to retrieve opportunities', err.statusCode || 500);
    }
  }

  /**
   * GET /api/opportunities/:id
   */
  async getOpportunityById(req, res) {
    try {
      const { id } = req.params;
      const opportunity = await opportunityService.getOpportunityById(id);

      return successResponse(res, 'Opportunity details retrieved successfully', opportunity);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to retrieve opportunity', err.statusCode || 404);
    }
  }

  /**
   * POST /api/opportunities
   * (Accessible by FINANCIAL_INSTITUTION, ADMIN)
   */
  async createOpportunity(req, res) {
    try {
      const publisher = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { financialInstitution: true }
      });
      const payload = {
        ...req.body,
        institution: publisher?.financialInstitution?.institutionName || req.body.institution
      };
      const opportunity = await opportunityService.createOpportunity(payload, req.user);
      return successResponse(res, 'Opportunity published and saved successfully', opportunity, 201);
    } catch (err) {
      console.error('createOpportunity error:', err);
      return errorResponse(res, err.message || 'Failed to create opportunity', err.statusCode || 400);
    }
  }

  /**
   * PUT /api/opportunities/:id
   */
  async updateOpportunity(req, res) {
    try {
      const { id } = req.params;
      const updated = await opportunityService.updateOpportunity(id, req.body);
      return successResponse(res, 'Opportunity updated successfully', updated);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to update opportunity', err.statusCode || 400);
    }
  }

  /**
   * DELETE /api/opportunities/:id
   */
  async deleteOpportunity(req, res) {
    try {
      const { id } = req.params;
      const result = await opportunityService.deleteOpportunity(id);
      return successResponse(res, 'Opportunity deleted successfully', result);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to delete opportunity', err.statusCode || 400);
    }
  }
}

export default new OpportunityController();
