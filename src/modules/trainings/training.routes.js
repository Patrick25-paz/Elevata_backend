import { Router } from 'express';
import trainingController from './training.controller.js';
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

// Public & Authenticated Read Endpoints
router.get('/', optionalAuthenticate, trainingController.getTrainings);
router.get('/:id', optionalAuthenticate, trainingController.getTrainingById);

// Training Management (Banker / Admin)
router.post('/', authenticate, authorize('FINANCIAL_INSTITUTION', 'ADMIN'), trainingController.createTraining);
router.put('/:id', authenticate, authorize('FINANCIAL_INSTITUTION', 'ADMIN'), trainingController.updateTraining);
router.delete('/:id', authenticate, authorize('FINANCIAL_INSTITUTION', 'ADMIN'), trainingController.deleteTraining);

// SME Enrollment & Attendance Endpoints
router.post('/:id/enroll', authenticate, authorize('BUSINESS'), trainingController.toggleEnrollment);
router.post('/:id/join', authenticate, authorize('BUSINESS'), trainingController.joinTraining);

// Live Room Synchronization (Attendees, Chat, Status)
router.patch('/:id/live', authenticate, trainingController.syncLiveRoom);

// LiveKit Cloud Room Access Token (Presenter & Attendee)
router.post('/:id/livekit-token', authenticate, trainingController.getLiveKitToken);
router.get('/:id/livekit-token', authenticate, trainingController.getLiveKitToken);

// WebRTC Signaling for Live Screen Streaming (Legacy Fallback)
router.post('/:id/signal', authenticate, trainingController.sendSignal);
router.get('/:id/signal', authenticate, trainingController.getSignals);

export default router;
