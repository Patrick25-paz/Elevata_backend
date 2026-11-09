import feedbackService from './feedback.service.js';
import { successResponse, createdResponse } from '../../utils/response.js';

class FeedbackController {
  /**
   * GET /api/feedback
   */
  async getTickets(req, res, next) {
    try {
      const { role, status, priority, senderId, search } = req.query;

      const isNonAdmin = req.user?.role && req.user.role !== 'ADMIN';

      const filters = {
        role: isNonAdmin ? req.user.role : role,
        status,
        priority,
        senderId: isNonAdmin ? req.user.id : senderId,
        senderEmail: isNonAdmin ? req.user.email : undefined,
        search
      };

      const tickets = await feedbackService.getTickets(filters);
      return successResponse(res, 'Feedback tickets retrieved successfully', tickets);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/feedback/:id
   */
  async getTicketById(req, res, next) {
    try {
      const { id } = req.params;
      const ticket = await feedbackService.getTicketById(id);
      return successResponse(res, 'Feedback ticket retrieved successfully', ticket);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/feedback
   */
  async createTicket(req, res, next) {
    try {
      const payload = {
        ...req.body,
        senderId: req.body.senderId || req.user?.id,
        senderRole: req.body.senderRole || req.user?.role || 'BUSINESS',
        senderEmail: req.body.senderEmail || req.user?.email
      };

      const newTicket = await feedbackService.createTicket(payload);
      return createdResponse(res, 'Feedback submitted successfully', newTicket);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/feedback/:id/messages
   */
  async addMessage(req, res, next) {
    try {
      const { id } = req.params;
      const payload = {
        ...req.body,
        senderId: req.body.senderId || req.user?.id,
        senderRole: req.body.senderRole || req.user?.role || 'BUSINESS'
      };

      const updatedTicket = await feedbackService.addMessage(id, payload);
      return successResponse(res, 'Message added successfully', updatedTicket);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/feedback/:id/status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await feedbackService.updateStatus(id, status);
      return successResponse(res, 'Status updated successfully', updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/feedback/:id/priority
   */
  async updatePriority(req, res, next) {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const updated = await feedbackService.updatePriority(id, priority);
      return successResponse(res, 'Priority updated successfully', updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/feedback/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const viewerRole = role || req.user?.role || 'BUSINESS';
      await feedbackService.markAsRead(id, viewerRole);
      return successResponse(res, 'Marked as read successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/feedback/:id
   */
  async deleteTicket(req, res, next) {
    try {
      const { id } = req.params;
      const result = await feedbackService.deleteTicket(id);
      return successResponse(res, 'Ticket deleted successfully', result);
    } catch (err) {
      next(err);
    }
  }
}

export default new FeedbackController();
