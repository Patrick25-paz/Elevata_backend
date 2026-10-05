import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';

class FeedbackService {
  /**
   * Retrieves feedback tickets with filtering options
   */
  async getTickets(filters = {}) {
    const { role, status, priority, senderId, senderEmail, search } = filters;

    const where = {};

    if (role && role !== 'ALL') {
      where.senderRole = role;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (senderId && senderEmail) {
      where.OR = [{ senderId }, { senderEmail }];
    } else if (senderId) {
      where.senderId = senderId;
    } else if (senderEmail) {
      where.senderEmail = senderEmail;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const searchConditions = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { organizationName: { contains: q, mode: 'insensitive' } },
        { senderName: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } }
      ];

      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const tickets = await prisma.feedbackTicket.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return tickets.map(this.formatTicket);
  }

  /**
   * Retrieves a single ticket by ID or ticketNumber
   */
  async getTicketById(id) {
    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      throw new AppError('Feedback ticket not found', 404);
    }

    return this.formatTicket(ticket);
  }

  /**
   * Creates a new ticket along with its first message
   */
  async createTicket(data) {
    const {
      subject,
      category,
      priority = 'Medium',
      senderId,
      senderName,
      senderEmail,
      senderPhone,
      senderRole = 'BUSINESS',
      organizationName,
      organizationSector,
      initialMessage
    } = data;

    if (!initialMessage || !initialMessage.trim()) {
      throw new AppError('Message is required', 400);
    }

    const cleanMessage = initialMessage.trim();
    const effectiveSubject =
      subject && subject.trim()
        ? subject.trim()
        : cleanMessage.length > 60
        ? cleanMessage.slice(0, 57) + '...'
        : cleanMessage;

    // Generate a unique ticket number e.g. "FB-4891"
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `FB-${randomSuffix}`;

    const newTicket = await prisma.feedbackTicket.create({
      data: {
        ticketNumber,
        subject: effectiveSubject,
        category: category || 'General Inquiry',
        priority: priority || 'Medium',
        status: 'Open',
        senderId: senderId || 'user-unknown',
        senderName: senderName || 'Anonymous User',
        senderEmail: senderEmail || 'noreply@elevata.rw',
        senderPhone: senderPhone || null,
        senderRole: senderRole || 'BUSINESS',
        organizationName: organizationName || 'Business Entity',
        organizationSector: organizationSector || 'General Sector',
        unreadByAdmin: true,
        unreadByUser: false,
        messages: {
          create: {
            senderId: senderId || 'user-unknown',
            senderName: senderName || 'Anonymous User',
            senderRole: senderRole || 'BUSINESS',
            senderOrgName: organizationName || 'Business Entity',
            content: initialMessage.trim()
          }
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return this.formatTicket(newTicket);
  }

  /**
   * Adds a new message into an existing ticket chat
   */
  async addMessage(ticketId, data) {
    const { senderId, senderName, senderRole, senderOrgName, content } = data;

    if (!content || !content.trim()) {
      throw new AppError('Message content cannot be empty', 400);
    }

    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketNumber: ticketId }]
      }
    });

    if (!ticket) {
      throw new AppError('Feedback ticket not found', 404);
    }

    const isAdmin = senderRole === 'ADMIN';

    // Auto update status if user replies to a resolved ticket
    const nextStatus =
      (ticket.status === 'Resolved' || ticket.status === 'Closed') && !isAdmin
        ? 'In Progress'
        : ticket.status;

    const [createdMsg, updatedTicket] = await prisma.$transaction([
      prisma.feedbackMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: senderId || 'sender-unknown',
          senderName: senderName || (isAdmin ? 'Elevata Admin' : 'Sender'),
          senderRole: senderRole || 'BUSINESS',
          senderOrgName: senderOrgName || (isAdmin ? 'Elevata Platform Admin' : 'Entity'),
          content: content.trim()
        }
      }),
      prisma.feedbackTicket.update({
        where: { id: ticket.id },
        data: {
          status: nextStatus,
          unreadByAdmin: !isAdmin,
          unreadByUser: isAdmin,
          updatedAt: new Date()
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })
    ]);

    return this.formatTicket(updatedTicket);
  }

  /**
   * Updates status of a ticket
   */
  async updateStatus(ticketId, status) {
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketNumber: ticketId }]
      }
    });

    if (!ticket) {
      throw new AppError('Feedback ticket not found', 404);
    }

    const updated = await prisma.feedbackTicket.update({
      where: { id: ticket.id },
      data: {
        status,
        updatedAt: new Date()
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return this.formatTicket(updated);
  }

  /**
   * Updates priority of a ticket
   */
  async updatePriority(ticketId, priority) {
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
    if (!validPriorities.includes(priority)) {
      throw new AppError(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`, 400);
    }

    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketNumber: ticketId }]
      }
    });

    if (!ticket) {
      throw new AppError('Feedback ticket not found', 404);
    }

    const updated = await prisma.feedbackTicket.update({
      where: { id: ticket.id },
      data: {
        priority,
        updatedAt: new Date()
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return this.formatTicket(updated);
  }

  /**
   * Marks a ticket as read by Admin or User
   */
  async markAsRead(ticketId, viewerRole) {
    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketNumber: ticketId }]
      }
    });

    if (!ticket) return null;

    const data = {};
    if (viewerRole === 'ADMIN') {
      data.unreadByAdmin = false;
    } else {
      data.unreadByUser = false;
    }

    return await prisma.feedbackTicket.update({
      where: { id: ticket.id },
      data
    });
  }

  /**
   * Deletes a ticket
   */
  async deleteTicket(ticketId) {
    const ticket = await prisma.feedbackTicket.findFirst({
      where: {
        OR: [{ id: ticketId }, { ticketNumber: ticketId }]
      }
    });

    if (!ticket) {
      throw new AppError('Feedback ticket not found', 404);
    }

    await prisma.feedbackTicket.delete({
      where: { id: ticket.id }
    });

    return { id: ticket.id, ticketNumber: ticket.ticketNumber };
  }

  /**
   * Formats database ticket representation for the frontend
   */
  formatTicket(ticket) {
    if (!ticket) return null;
    return {
      id: ticket.ticketNumber || ticket.id,
      dbId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      senderId: ticket.senderId,
      senderName: ticket.senderName,
      senderEmail: ticket.senderEmail,
      senderPhone: ticket.senderPhone,
      senderRole: ticket.senderRole,
      organizationName: ticket.organizationName,
      organizationSector: ticket.organizationSector,
      assignedAdmin: ticket.assignedAdmin,
      unreadByAdmin: ticket.unreadByAdmin,
      unreadByUser: ticket.unreadByUser,
      createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
      updatedAt: ticket.updatedAt instanceof Date ? ticket.updatedAt.toISOString() : ticket.updatedAt,
      messages: (ticket.messages || []).map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        senderRole: m.senderRole,
        senderOrgName: m.senderOrgName,
        content: m.content,
        createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt
      }))
    };
  }
}

export default new FeedbackService();
