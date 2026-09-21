import trainingRepository from './training.repository.js';

const INITIAL_TRAININGS = [
  {
    id: 'tr-1',
    title: 'Financial Readiness & Tax Compliance Masterclass',
    description: 'Learn how to properly prepare tax clearances, maintain clean financial ledgers, and leverage digital logs to unlock bank financing.',
    date: '2026-08-22',
    time: '10:00 AM - 12:00 PM',
    durationMinutes: 120,
    speaker: 'Jean Paul Habimana',
    speakerRole: 'Senior Credit & Compliance Advisor',
    speakerOrg: 'BPR Bank / RRA Taskforce',
    meetingLink: 'https://elevata.live/rooms/tr-1',
    targetAudience: ['Low Readiness SMEs', 'Retail', 'Agriculture', 'Wholesale'],
    participantsCount: 45,
    hasCertificate: true,
    status: 'live',
    opportunityId: 'opp-1',
    opportunityTitle: 'Business Expansion Loan',
    curriculum: [
      'Understanding RRA Tax Clearance & EBM compliance requirements',
      'Bank cash flow debt-service ratio (DSCR) calculations',
      'Automated accounting records vs. physical manual logs',
      'Step-by-step credit application dossier compilation'
    ],
    materials: [
      { title: 'SME Tax Clearance Checklist.pdf', url: '#', size: '1.2 MB' },
      { title: 'Credit Readiness Evaluation Sheet.xlsx', url: '#', size: '850 KB' },
      { title: 'Presentation Slides - Session 1.pdf', url: '#', size: '3.4 MB' }
    ],
    attendees: [
      { id: 'sme-1', name: 'Marie Kabera', businessName: "Marie's Kigali Fresh Mart", sector: 'Retail', avatar: 'MK', status: 'admitted', handRaised: false, cameraOn: true, joinedAt: '10:02 AM' },
      { id: 'sme-2', name: 'Jean Bosco', businessName: 'Rwanda Agro-Processors Ltd', sector: 'Agriculture', avatar: 'JB', status: 'admitted', handRaised: true, cameraOn: false, joinedAt: '10:05 AM' },
      { id: 'sme-3', name: 'David Mugisha', businessName: 'David Transport Haulage', sector: 'Logistics', avatar: 'DM', status: 'waiting', handRaised: false, cameraOn: true, joinedAt: '10:14 AM' },
      { id: 'sme-4', name: 'Divine Mutoni', businessName: 'Gisenyi Tech Solutions', sector: 'Technology', avatar: 'DM', status: 'waiting', handRaised: false, cameraOn: false, joinedAt: '10:15 AM' }
    ],
    chatMessages: [
      { id: 'm-1', senderName: 'Jean Paul Habimana (Trainer)', senderRole: 'host', text: 'Welcome everyone! We will begin the session on credit readiness dossier requirements in 2 minutes.', timestamp: '10:00 AM' },
      { id: 'm-2', senderName: 'Marie Kabera', senderRole: 'attendee', avatar: 'MK', text: 'Good morning Jean Paul! Excited to attend from Kigali.', timestamp: '10:02 AM' },
      { id: 'm-3', senderName: 'Jean Bosco', senderRole: 'attendee', avatar: 'JB', text: 'Does BPR require audited statements for agricultural cooperatives under 50M?', timestamp: '10:08 AM' }
    ]
  },
  {
    id: 'tr-2',
    title: 'Scaling Agribusiness Operations in East Africa',
    description: 'A deep-dive workshop into modern inventory logistics, cooperative management, and obtaining processing certificates.',
    date: '2026-08-25',
    time: '02:00 PM - 04:30 PM',
    durationMinutes: 150,
    speaker: 'Dr. Agnes Kalibata',
    speakerRole: 'Director of Agribusiness Scaling',
    speakerOrg: 'AgroGrow Rwanda',
    meetingLink: 'https://elevata.live/rooms/tr-2',
    targetAudience: ['Agriculture', 'High Growth SMEs'],
    participantsCount: 68,
    hasCertificate: true,
    status: 'scheduled',
    opportunityId: 'opp-2',
    opportunityTitle: 'Agribusiness Growth Grant',
    curriculum: [
      'Seasonal working capital structuring',
      'Cold chain storage and harvest losses reduction',
      'Contract farming agreements with commercial buyers'
    ],
    materials: [
      { title: 'Agri Supply Chain Handbook.pdf', url: '#', size: '4.1 MB' }
    ],
    attendees: [
      { id: 'sme-2', name: 'Jean Bosco', businessName: 'Rwanda Agro-Processors Ltd', sector: 'Agriculture', avatar: 'JB', status: 'admitted', joinedAt: '02:00 PM' }
    ],
    chatMessages: []
  },
  {
    id: 'tr-3',
    title: 'SME Digitization & E-commerce Strategy',
    description: 'Interactive session outlining how digital point-of-sale systems can automate cashflow tracking and generate pre-approved credit files.',
    date: '2026-08-28',
    time: '09:00 AM - 11:30 AM',
    durationMinutes: 150,
    speaker: 'Divine Mutoni',
    speakerRole: 'Head of Fintech Integrations',
    speakerOrg: 'Gisenyi Tech Solutions',
    meetingLink: 'https://elevata.live/rooms/tr-3',
    targetAudience: ['Women', 'Retail', 'Technology'],
    participantsCount: 32,
    hasCertificate: true,
    status: 'completed',
    curriculum: [
      'Setting up digital POS merchant wallets',
      'Automated transaction reporting for credit scoring'
    ],
    materials: [
      { title: 'Digital Rails Playbook.pdf', url: '#', size: '2.5 MB' }
    ],
    attendees: [],
    chatMessages: []
  }
];

class TrainingService {
  constructor() {
    this.inMemoryTrainings = [...INITIAL_TRAININGS];
    this.inMemoryEnrollments = new Map(); // key: `${trainingId}_${smeId}`
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
   * Seed default trainings into DB if empty.
   */
  async ensureSeedData() {
    try {
      const existing = await trainingRepository.findAll();
      if (!existing || existing.length === 0) {
        for (const tr of INITIAL_TRAININGS) {
          try {
            await trainingRepository.create({
              id: tr.id,
              title: tr.title,
              description: tr.description,
              date: tr.date,
              time: tr.time,
              durationMinutes: tr.durationMinutes,
              speaker: tr.speaker,
              speakerRole: tr.speakerRole,
              speakerOrg: tr.speakerOrg,
              meetingLink: tr.meetingLink,
              targetAudience: tr.targetAudience,
              participantsCount: tr.participantsCount,
              status: tr.status,
              hasCertificate: tr.hasCertificate,
              opportunityId: tr.opportunityId,
              opportunityTitle: tr.opportunityTitle,
              curriculum: tr.curriculum,
              materials: tr.materials,
              attendees: tr.attendees,
              chatMessages: tr.chatMessages
            });
          } catch (e) {
            // ignore duplicate or creation errors during seeding
          }
        }
      }
    } catch (err) {
      console.warn('Seed trainings check bypassed:', err.message);
    }
  }

  /**
   * Retrieve all trainings with optional filters and current SME's enrollment status.
   */
  async getAllTrainings(filters = {}, currentSmeId = null) {
    try {
      await this.ensureSeedData();
      const dbTrainings = await trainingRepository.findAll(filters);
      if (dbTrainings && dbTrainings.length > 0) {
        return dbTrainings.map(t => this._formatWithSmeContext(t, currentSmeId));
      }
    } catch (e) {
      console.warn('DB training query failed, falling back to memory store:', e.message);
    }

    // Memory fallback
    let results = [...this.inMemoryTrainings];
    if (filters.status && filters.status !== 'all') {
      results = results.filter(t => t.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(t =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.speaker || '').toLowerCase().includes(q) ||
        (t.speakerOrg || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    return results.map(t => {
      const key = `${t.id}_${currentSmeId}`;
      const enr = this.inMemoryEnrollments.get(key);
      return {
        ...t,
        enrolled: !!enr,
        attended: enr?.attended || t.attended || false,
        completed: enr?.completed || t.completed || false
      };
    });
  }

  /**
   * Retrieve single training details by ID.
   */
  async getTrainingById(id, currentSmeId = null) {
    try {
      const dbTraining = await trainingRepository.findById(id);
      if (dbTraining) {
        return this._formatWithSmeContext(dbTraining, currentSmeId);
      }
    } catch (e) {}

    const item = this.inMemoryTrainings.find(t => t.id === id);
    if (!item) {
      const err = new Error('Training session not found');
      err.statusCode = 404;
      throw err;
    }

    const key = `${item.id}_${currentSmeId}`;
    const enr = this.inMemoryEnrollments.get(key);
    return {
      ...item,
      enrolled: !!enr,
      attended: enr?.attended || item.attended || false,
      completed: enr?.completed || item.completed || false
    };
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

    try {
      const created = await trainingRepository.create(trainingData);
      return created;
    } catch (e) {
      console.warn('DB create training failed, saving in memory:', e.message);
      const fallbackItem = {
        id: `tr-${Date.now()}`,
        ...trainingData,
        createdAt: new Date().toISOString()
      };
      this.inMemoryTrainings.unshift(fallbackItem);
      return fallbackItem;
    }
  }

  /**
   * Update existing training masterclass.
   */
  async updateTraining(id, payload) {
    try {
      return await trainingRepository.update(id, payload);
    } catch (e) {
      const idx = this.inMemoryTrainings.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.inMemoryTrainings[idx] = { ...this.inMemoryTrainings[idx], ...payload };
        return this.inMemoryTrainings[idx];
      }
      throw e;
    }
  }

  /**
   * Delete training masterclass.
   */
  async deleteTraining(id) {
    try {
      return await trainingRepository.delete(id);
    } catch (e) {
      this.inMemoryTrainings = this.inMemoryTrainings.filter(t => t.id !== id);
      return { id };
    }
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

    try {
      const existing = await trainingRepository.findEnrollment(trainingId, smeId);
      if (existing) {
        await trainingRepository.deleteEnrollment(trainingId, smeId);
        await trainingRepository.update(trainingId, {
          participantsCount: { decrement: 1 }
        });
        return { enrolled: false, message: 'Unenrolled successfully' };
      } else {
        await trainingRepository.upsertEnrollment(trainingId, smeId, { userId });
        await trainingRepository.update(trainingId, {
          participantsCount: { increment: 1 }
        });
        return { enrolled: true, message: 'Enrolled successfully' };
      }
    } catch (e) {
      // Memory fallback
      const key = `${trainingId}_${smeId}`;
      const hasEnrolled = this.inMemoryEnrollments.has(key);
      const tr = this.inMemoryTrainings.find(t => t.id === trainingId);

      if (hasEnrolled) {
        this.inMemoryEnrollments.delete(key);
        if (tr) tr.participantsCount = Math.max(0, (tr.participantsCount || 1) - 1);
        return { enrolled: false, message: 'Unenrolled successfully' };
      } else {
        this.inMemoryEnrollments.set(key, { smeId, userId, enrolledAt: new Date().toISOString() });
        if (tr) tr.participantsCount = (tr.participantsCount || 0) + 1;
        return { enrolled: true, message: 'Enrolled successfully' };
      }
    }
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

    try {
      await trainingRepository.upsertEnrollment(trainingId, smeId, {
        userId,
        attended: true,
        completed: true,
        hasCertificate: true
      });
      return { success: true, attended: true, completed: true, hasCertificate: true };
    } catch (e) {
      const key = `${trainingId}_${smeId}`;
      this.inMemoryEnrollments.set(key, {
        smeId,
        userId,
        attended: true,
        completed: true,
        hasCertificate: true
      });
      return { success: true, attended: true, completed: true, hasCertificate: true };
    }
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

    try {
      return await trainingRepository.update(trainingId, updateData);
    } catch (e) {
      const tr = this.inMemoryTrainings.find(t => t.id === trainingId);
      if (tr) {
        if (status !== undefined) tr.status = status;
        if (attendees !== undefined) tr.attendees = attendees;
        if (chatMessages !== undefined) tr.chatMessages = chatMessages;
        if (liveState !== undefined) tr.liveState = liveState;
        return tr;
      }
      throw e;
    }
  }

  /**
   * WebRTC P2P signaling exchange for cross-device screen share
   */
  sendSignal(trainingId, { from, to, signal }) {
    if (!this.signals) this.signals = [];
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
    if (!this.signals) return [];
    return this.signals.filter(s =>
      s.trainingId === trainingId &&
      s.from !== peerId &&
      (s.to === peerId || s.to === 'all') &&
      s.timestamp > Number(since || 0)
    );
  }
}

export default new TrainingService();
