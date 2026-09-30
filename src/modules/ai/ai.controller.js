import aiService from './ai.service.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/prisma.js';

class AIController {
  /**
   * Handles interactive chat queries from users (SMEs, Financial Institutions, or Admins).
   */
  async chatWithBot(req, res) {
    const { message, history, context = {} } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        business: {
          include: {
            applications: { select: { id: true, status: true } },
            products: { select: { id: true, unitPrice: true, stockQuantity: true } }
          }
        },
        financialInstitution: true
      }
    }) || req.user;

    const enrichedContext = { ...context };

    // If SME, compute live operational and application counts
    if (user?.business) {
      const biz = user.business;
      enrichedContext.activeSmeName = enrichedContext.activeSmeName || biz.businessName;
      enrichedContext.activeSmeSector = enrichedContext.activeSmeSector || biz.businessType;
      enrichedContext.smeStats = {
        appliedCount: biz.applications?.length || 0,
        productsCount: biz.products?.length || 0
      };
    }

    // If Financial Institution, compute live opportunities and applicant counts
    if (user?.financialInstitution) {
      const fi = user.financialInstitution;
      const [oppsCount, appsCount] = await Promise.all([
        prisma.opportunity.count({
          where: { institution: { contains: fi.institutionName, mode: 'insensitive' } }
        }).catch(() => 0),
        prisma.financingApplication.count({
          where: {
            opportunity: {
              institution: { contains: fi.institutionName, mode: 'insensitive' }
            }
          }
        }).catch(() => 0)
      ]);

      enrichedContext.institutionName = enrichedContext.institutionName || fi.institutionName;
      enrichedContext.representativeName = enrichedContext.representativeName || fi.representativeName;
      enrichedContext.fiStats = {
        publishedCount: oppsCount,
        applicationsCount: appsCount
      };
    }

    // Fetch active published opportunities from database
    const activeOpportunities = await prisma.opportunity.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        title: true,
        institution: true,
        category: true,
        description: true,
        maxFunding: true,
        deadline: true,
        sectors: true,
        minRevenue: true,
        minHealthScore: true,
        minReadinessScore: true,
        registrationRequired: true,
        taxCompliance: true,
        collateralRequired: true
      },
      take: 12,
      orderBy: { createdAt: 'desc' }
    }).catch(() => []);

    enrichedContext.availableOpportunities = activeOpportunities;

    const result = await aiService.generateChatResponse({
      user,
      message,
      history,
      context: enrichedContext
    });

    return successResponse(res, 'AI response generated successfully', result);
  }

  /**
   * Returns contextual prompt suggestions based on user role.
   */
  async getSuggestions(req, res) {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { business: true, financialInstitution: true }
    }) || req.user;
    const suggestions = aiService.getQuickSuggestions(user);
    return successResponse(res, 'Suggestions retrieved successfully', suggestions);
  }
}

export default new AIController();

