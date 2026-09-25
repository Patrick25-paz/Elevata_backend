import trainingRepository from './training.repository.js';

class TrainingService {
  constructor() {
    this.signals = [];
  }

  /**
   * Format a training entity with SME-specific enrollment flags.
   */
  _formatWithSmeContext(training, currentSmeId) {
    const enrollments = training.enrollments || [];
    const userEnrollment = currentSmeId
      ? enrollments.find(e => e.smeId === currentSmeId)
      : null;

    const isEnrolled = !!userEnrollment;
    const hasAttended = userEnrollment?.attended || false;
    const hasCompleted = userEnrollment?.completed || false;

    return {
      ...training,
      enrolled: isEnrolled,
      attended: hasAttended,
      completed: hasCompleted,
      enrolledAt: userEnrollment?.enrolledAt || null,
      participantsCount: Math.max(training.participantsCount || 0, enrollments.length)
    };
  }

  /**
   * Retrieve all trainings with optional filters and current SME's enrollment status.
   */
  async getAllTrainings(filters = {}, currentSmeId = null) {
    const dbTrainings = await trainingRepository.findAll(filters);
    return dbTrainings.map(t => this._formatWithSmeContext(t, currentSmeId));
  }

  /**
   * Retrieve single training details by ID.
   */
  async getTrainingById(id, currentSmeId = null) {
    const dbTraining = await trainingRepository.findById(id);
    if (!dbTraining) {
      const err = new Error('Training session not found');
      err.statusCode = 404;
      throw err;
    }
    return this._formatWithSmeContext(dbTraining, currentSmeId);
  }

  /**
   * Schedule a new training masterclass.
   */
  async createTraining(payload, user = {}) {
    const {
      title,
      description,
      date,
      time,
      durationMinutes = 60,
      speaker,
      speakerRole,
      speakerOrg,
      meetingLink,
      targetAudience = ['All Sectors'],
      opportunityId,
      opportunityTitle,
      curriculum = [],
      maxCapacity = 100,
      hasCertificate = true,
      materials = []
    } = payload;

    if (!title || !description || !date || !time || !speaker) {
      const err = new Error('Title, description, date, time, and speaker are required');
      err.statusCode = 400;
      throw err;
    }

    const initialChat = [
      {
        id: `m-init-${Date.now()}`,
        senderName: speaker,
        senderRole: 'host',
        text: `Welcome to ${title}! The session is scheduled for ${date} at ${time}.`,
        timestamp: 'Scheduled'
      }
    ];

    const trainingData = {
      title,
      description,
      date,
      time,
      durationMinutes: Number(durationMinutes) || 60,
      speaker,
      speakerRole: speakerRole || user.representativeName || null,
      speakerOrg: speakerOrg || user.institutionName || 'Financial Institution Partner',
      meetingLink: meetingLink || `https://elevata.live/rooms/tr-${Date.now().toString(36)}`,
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
      participantsCount: 0,
      status: 'scheduled',
      hasCertificate: Boolean(hasCertificate),
      opportunityId: opportunityId || null,
      opportunityTitle: opportunityTitle || null,
      curriculum: Array.isArray(curriculum) ? curriculum : [],
      maxCapacity: Number(maxCapacity) || 100,
      materials: materials || [],
      attendees: [],
      chatMessages: initialChat,
      authorId: user.id || null
    };

    return trainingRepository.create(trainingData);
  }

  /**
   * Update existing training masterclass.
   */
  async updateTraining(id, payload) {
    return trainingRepository.update(id, payload);
  }

  /**
   * Delete training masterclass.
   */
  async deleteTraining(id) {
    return trainingRepository.delete(id);
  }

  /**
   * Toggle enrollment for an SME.
   */
  async toggleEnrollment(trainingId, smeId, userId = null) {
    if (!smeId) {
      const err = new Error('SME ID is required to enroll');
      err.statusCode = 400;
      throw err;
    }

    const existing = await trainingRepository.findEnrollment(trainingId, smeId);
    if (existing) {
      await trainingRepository.deleteEnrollment(trainingId, smeId);
      await trainingRepository.update(trainingId, { participantsCount: { decrement: 1 } });
      return { enrolled: false, message: 'Unenrolled successfully' };
    }
    await trainingRepository.upsertEnrollment(trainingId, smeId, { userId });
    await trainingRepository.update(trainingId, { participantsCount: { increment: 1 } });
    return { enrolled: true, message: 'Enrolled successfully' };
  }

  /**
   * Mark an SME as joined/completed a training.
   */
  async joinTraining(trainingId, smeId, userId = null) {
    if (!smeId) {
      const err = new Error('SME ID is required');
      err.statusCode = 400;
      throw err;
    }

    await trainingRepository.upsertEnrollment(trainingId, smeId, {
      userId,
      attended: true,
      completed: true,
      hasCertificate: true
    });
    return { success: true, attended: true, completed: true, hasCertificate: true };
  }

  /**
   * Sync virtual room state (status, attendees, messages, liveState).
   */
  async syncLiveRoom(trainingId, { status, attendees, chatMessages, liveState }) {
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (chatMessages !== undefined) updateData.chatMessages = chatMessages;
    if (liveState !== undefined) updateData.liveState = liveState;

    return trainingRepository.update(trainingId, updateData);
  }

  /**
   * WebRTC P2P signaling exchange for cross-device screen share
   */
  sendSignal(trainingId, { from, to, signal }) {
    const entry = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      trainingId,
      from,
      to: to || 'all',
      signal,
      timestamp: Date.now()
    };
    this.signals.push(entry);
    const cutoff = Date.now() - 45000;
    this.signals = this.signals.filter(s => s.timestamp > cutoff);
    return entry;
  }

  getSignals(trainingId, peerId, since = 0) {
    return this.signals.filter(s =>
      s.trainingId === trainingId &&
      s.from !== peerId &&
      (s.to === peerId || s.to === 'all') &&
      s.timestamp > Number(since || 0)
    );
  }
}

export default new TrainingService();
