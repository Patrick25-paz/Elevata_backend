import { Router } from 'express';
import feedbackController from './feedback.controller.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import prisma from '../../config/prisma.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id }
      });
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    }
  } catch (e) {
    // Ignore token errors in optional mode
  }
  next();
};

const router = Router();

// Retrieve tickets with filters (?role=...&status=...&priority=...&search=...)
router.get('/', optionalAuthenticate, feedbackController.getTickets);

// Retrieve single ticket by ID
router.get('/:id', optionalAuthenticate, feedbackController.getTicketById);

// Submit new feedback ticket
router.post('/', optionalAuthenticate, feedbackController.createTicket);

// Send reply chat message in a ticket
router.post('/:id/messages', optionalAuthenticate, feedbackController.addMessage);

// Update ticket status
router.patch('/:id/status', optionalAuthenticate, feedbackController.updateStatus);

// Update ticket priority
router.patch('/:id/priority', optionalAuthenticate, feedbackController.updatePriority);

// Mark ticket as read
router.patch('/:id/read', optionalAuthenticate, feedbackController.markAsRead);

// Delete ticket (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN'), feedbackController.deleteTicket);

export default router;
