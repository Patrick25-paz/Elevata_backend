import aiService from './ai.service.js';
import { successResponse } from '../../utils/response.js';
import prisma from '../../config/prisma.js';

class AIController {
  /**
   * Handles interactive chat queries from users (SMEs or Financial Institutions).
   */
  async chatWithBot(req, res) {
    const { message, history, context } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { business: true, financialInstitution: true }
    }) || req.user;

    const result = await aiService.generateChatResponse({
      user,
      message,
      history,
      context
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
