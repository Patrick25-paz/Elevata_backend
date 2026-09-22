import { Router } from 'express';
import trainingController from './training.controller.js';
import { verifyAccessToken } from '../../utils/jwt.js';
import prisma from '../../config/prisma.js';

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
router.post('/', optionalAuthenticate, trainingController.createTraining);
router.put('/:id', optionalAuthenticate, trainingController.updateTraining);
router.delete('/:id', optionalAuthenticate, trainingController.deleteTraining);

// SME Enrollment & Attendance Endpoints
router.post('/:id/enroll', optionalAuthenticate, trainingController.toggleEnrollment);
router.post('/:id/join', optionalAuthenticate, trainingController.joinTraining);

// Live Room Synchronization (Attendees, Chat, Status)
router.patch('/:id/live', optionalAuthenticate, trainingController.syncLiveRoom);

// LiveKit Cloud Room Access Token (Presenter & Attendee)
router.post('/:id/livekit-token', optionalAuthenticate, trainingController.getLiveKitToken);
router.get('/:id/livekit-token', optionalAuthenticate, trainingController.getLiveKitToken);

// WebRTC Signaling for Live Screen Streaming (Legacy Fallback)
router.post('/:id/signal', optionalAuthenticate, trainingController.sendSignal);
router.get('/:id/signal', optionalAuthenticate, trainingController.getSignals);

export default router;
