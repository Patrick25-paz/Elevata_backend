import trainingService from './training.service.js';
import livekitService from './livekit.service.js';
import { successResponse, errorResponse } from '../../utils/response.js';

class TrainingController {
  /**
   * GET /api/trainings
   * Query params: status, search, smeId
   */
  async getTrainings(req, res) {
    try {
      const { status, search, smeId } = req.query;
      const currentSmeId = smeId || (req.user && req.user.role === 'BUSINESS' ? req.user.business?.id : null);
      
      const trainings = await trainingService.getAllTrainings({ status, search }, currentSmeId);
      return successResponse(res, 'Virtual training masterclasses retrieved successfully', trainings);
    } catch (err) {
      console.error('getTrainings error:', err);
      return errorResponse(res, err.message || 'Failed to retrieve trainings', err.statusCode || 500);
    }
  }

  /**
   * GET /api/trainings/:id
   */
  async getTrainingById(req, res) {
    try {
      const { id } = req.params;
      const { smeId } = req.query;
      const training = await trainingService.getTrainingById(id, smeId);
      return successResponse(res, 'Training details retrieved successfully', training);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to retrieve training details', err.statusCode || 404);
    }
  }

  /**
   * POST /api/trainings
   * Accessible by FINANCIAL_INSTITUTION, ADMIN
   */
  async createTraining(req, res) {
    try {
      const training = await trainingService.createTraining(req.body, req.user || {});
      return successResponse(res, 'Virtual training scheduled and saved successfully', training, 201);
    } catch (err) {
      console.error('createTraining error:', err);
      return errorResponse(res, err.message || 'Failed to schedule training', err.statusCode || 400);
    }
  }

  /**
   * PUT /api/trainings/:id
   */
  async updateTraining(req, res) {
    try {
      const { id } = req.params;
      const updated = await trainingService.updateTraining(id, req.body);
      return successResponse(res, 'Training schedule updated successfully', updated);
    } catch (err) {
      console.error('updateTraining error:', err);
      return errorResponse(res, err.message || 'Failed to update training', err.statusCode || 400);
    }
  }

  /**
   * DELETE /api/trainings/:id
   */
  async deleteTraining(req, res) {
    try {
      const { id } = req.params;
      await trainingService.deleteTraining(id);
      return successResponse(res, 'Training session deleted successfully', { id });
    } catch (err) {
      console.error('deleteTraining error:', err);
      return errorResponse(res, err.message || 'Failed to delete training', err.statusCode || 400);
    }
  }

  /**
   * POST /api/trainings/:id/enroll
   * Toggle enrollment for an SME
   */
  async toggleEnrollment(req, res) {
    try {
      const { id } = req.params;
      const { smeId } = req.body;
      const resolvedSmeId = smeId || (req.user && req.user.role === 'BUSINESS' ? req.user.business?.id : null);
      const userId = req.user?.id || null;

      const result = await trainingService.toggleEnrollment(id, resolvedSmeId, userId);
      return successResponse(res, result.message, result);
    } catch (err) {
      console.error('toggleEnrollment error:', err);
      return errorResponse(res, err.message || 'Failed to toggle enrollment', err.statusCode || 400);
    }
  }

  /**
   * POST /api/trainings/:id/join
   * Mark SME as joined / completed
   */
  async joinTraining(req, res) {
    try {
      const { id } = req.params;
      const { smeId } = req.body;
      const resolvedSmeId = smeId || (req.user && req.user.role === 'BUSINESS' ? req.user.business?.id : null);
      const userId = req.user?.id || null;

      const result = await trainingService.joinTraining(id, resolvedSmeId, userId);
      return successResponse(res, 'Session joined and completed successfully', result);
    } catch (err) {
      console.error('joinTraining error:', err);
      return errorResponse(res, err.message || 'Failed to record session attendance', err.statusCode || 400);
    }
  }

  /**
   * PATCH /api/trainings/:id/live
   * Synchronize live session attendees, chat messages, or status
   */
  async syncLiveRoom(req, res) {
    try {
      const { id } = req.params;
      const { status, attendees, chatMessages, liveState } = req.body;
      const updated = await trainingService.syncLiveRoom(id, { status, attendees, chatMessages, liveState });
      return successResponse(res, 'Live room state synchronized', updated);
    } catch (err) {
      console.error('syncLiveRoom error:', err);
      return errorResponse(res, err.message || 'Failed to sync live room', err.statusCode || 400);
    }
  }

  /**
   * POST /api/trainings/:id/signal
   * Send WebRTC signal (offer, answer, candidate)
   */
  async sendSignal(req, res) {
    try {
      const { id } = req.params;
      const { from, to, signal } = req.body;
      const result = trainingService.sendSignal(id, { from, to, signal });
      return successResponse(res, 'Signal sent', result);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to send signal', 400);
    }
  }

  /**
   * GET /api/trainings/:id/signal
   * Retrieve pending WebRTC signals
   */
  async getSignals(req, res) {
    try {
      const { id } = req.params;
      const { peerId, since } = req.query;
      const signals = trainingService.getSignals(id, peerId, since);
      return successResponse(res, 'Signals retrieved', signals);
    } catch (err) {
      return errorResponse(res, err.message || 'Failed to retrieve signals', 400);
    }
  }

  /**
   * POST /api/trainings/:id/livekit-token
   * Generate LiveKit token for presenter or attendee
   */
  async getLiveKitToken(req, res) {
    try {
      const { id } = req.params;
      if (!livekitService.isConfigured()) {
        return successResponse(res, 'LiveKit is unavailable; secure WebRTC fallback will be used.', {
          enabled: false,
          fallback: 'webrtc'
        });
      }
      const { participantName } = req.body || {};
      const isHost = req.user?.role === 'FINANCIAL_INSTITUTION' || req.user?.role === 'ADMIN';
      const resolvedParticipantId = req.user?.id;
      const resolvedParticipantName = participantName || req.user?.name || req.user?.email;

      const tokenData = await livekitService.generateToken({
        trainingId: id,
        participantId: resolvedParticipantId,
        participantName: resolvedParticipantName,
        isHost,
      });

      return successResponse(res, 'LiveKit room token generated successfully', tokenData);
    } catch (err) {
      console.error('getLiveKitToken error:', err);
      return errorResponse(res, err.message || 'Failed to generate LiveKit token', 500);
    }
  }
}

export default new TrainingController();
