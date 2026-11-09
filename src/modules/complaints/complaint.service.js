import { randomBytes } from 'node:crypto';
import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { sendEmail } from '../../utils/resend.js';

const INTERNAL_RECIPIENT = 'info@voltaleltd.com';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const referenceNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ELV-${date}-${randomBytes(4).toString('hex').toUpperCase()}`;
};

const complaintSummary = (complaint) => `
  <table style="border-collapse:collapse;width:100%;font-family:Arial,sans-serif;font-size:14px">
    ${[['Complaint Reference', complaint.referenceNumber], ['Submitted', complaint.submittedAt.toISOString()], ['Full Name', complaint.fullName], ['Email', complaint.email], ['Phone', complaint.phone], ['Organization', complaint.organizationName], ['Role', complaint.role], ['Category', complaint.category], ['Related Institution / Provider', complaint.relatedInstitution], ['Transaction / Application ID', complaint.transactionReference], ['Subject', complaint.subject], ['Preferred Resolution', complaint.preferredResolution]].map(([label, value]) => value ? `<tr><th style="text-align:left;padding:8px;border:1px solid #e2e8f0;background:#f8fafc">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #e2e8f0">${escapeHtml(value)}</td></tr>` : '').join('')}
    <tr><th style="text-align:left;padding:8px;border:1px solid #e2e8f0;background:#f8fafc">Description</th><td style="padding:8px;border:1px solid #e2e8f0;white-space:pre-wrap">${escapeHtml(complaint.description)}</td></tr>
  </table>`;

class ComplaintService {
  async createComplaint({ user, data, file }) {
    if (data.website) throw new AppError('Unable to process this submission.', 400);

    const complaint = await prisma.complaint.create({
      data: {
        referenceNumber: referenceNumber(),
        submittedById: user.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        organizationName: data.organizationName || null,
        role: data.role,
        category: data.category,
        relatedInstitution: data.relatedInstitution || null,
        transactionReference: data.transactionReference || null,
        subject: data.subject,
        description: data.description,
        preferredResolution: data.preferredResolution || null,
        evidence: file ? { create: { fileName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size, content: file.buffer } } : undefined,
        auditEvents: { create: { actorId: user.id, action: 'Complaint submitted', toStatus: 'Received' } }
      }
    });

    const summary = complaintSummary(complaint);
    const subject = `[Elevata Complaint] ${complaint.category} – ${complaint.referenceNumber}`;
    const internalHtml = `<div style="font-family:Arial,sans-serif"><h2>New Elevata complaint</h2>${summary}<p>Supporting evidence is stored securely in the Elevata complaint record and is not attached to this email.</p></div>`;
    const acknowledgementHtml = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your complaint has been received</h2><p>Thank you for contacting Elevata Support. Your complaint has been recorded for review.</p><p><strong>Complaint Reference:</strong> ${escapeHtml(complaint.referenceNumber)}</p><p>Our team will review your concern and contact you regarding the next steps. Please keep your reference number for future communication.</p><p>For urgent assistance, contact <a href="mailto:info@voltaleltd.com">info@voltaleltd.com</a> or +250 791 689 396.</p></div>`;

    let internalStatus = 'Sent';
    let acknowledgementStatus = 'Sent';
    let deliveryError = null;
    try { await sendEmail({ to: INTERNAL_RECIPIENT, subject, html: internalHtml }); } catch (error) { internalStatus = 'Failed'; deliveryError = error.message; }
    try { await sendEmail({ to: complaint.email, subject: `We received your Elevata complaint ${complaint.referenceNumber}`, html: acknowledgementHtml }); } catch (error) { acknowledgementStatus = 'Failed'; deliveryError = deliveryError || error.message; }

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: { emailDeliveryStatus: internalStatus, acknowledgementStatus, emailDeliveryError: deliveryError }
    });
    if (internalStatus === 'Failed' || acknowledgementStatus === 'Failed') {
      throw new AppError(`Complaint recorded as ${complaint.referenceNumber}, but email delivery could not be completed. Please contact support with this reference.`, 502);
    }
    return { referenceNumber: updated.referenceNumber, submittedAt: updated.submittedAt };
  }

  async listComplaints(filters = {}) {
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    if (filters.from || filters.to) where.submittedAt = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {})
    };
    if (filters.search) where.OR = [{ referenceNumber: { contains: filters.search, mode: 'insensitive' } }, { subject: { contains: filters.search, mode: 'insensitive' } }, { email: { contains: filters.search, mode: 'insensitive' } }];
    return prisma.complaint.findMany({ where, include: { evidence: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true } }, auditEvents: { orderBy: { createdAt: 'asc' } } }, orderBy: { submittedAt: 'desc' } });
  }

  async updateComplaint(id, data, actorId) {
    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing) throw new AppError('Complaint not found.', 404);
    const nextStatus = data.status || existing.status;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.complaint.update({ where: { id }, data: { ...data, assignedTo: data.assignedTo || null, resolvedAt: ['Resolved', 'Closed'].includes(nextStatus) ? new Date() : existing.resolvedAt } });
      await tx.complaintAudit.create({ data: { complaintId: id, actorId, action: 'Complaint updated', fromStatus: existing.status, toStatus: nextStatus, notes: data.internalNotes || data.resolutionDetails || null } });
      return result;
    });
    return updated;
  }

  async retryDelivery(id, actorId) {
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) throw new AppError('Complaint not found.', 404);

    const subject = `[Elevata Complaint] ${complaint.category} – ${complaint.referenceNumber}`;
    const internalHtml = `<div style="font-family:Arial,sans-serif"><h2>Complaint delivery retry</h2>${complaintSummary(complaint)}<p>Supporting evidence is stored securely in the Elevata complaint record.</p></div>`;
    const acknowledgementHtml = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Your complaint has been received</h2><p>Thank you for contacting Elevata Support. Your complaint has been recorded for review.</p><p><strong>Complaint Reference:</strong> ${escapeHtml(complaint.referenceNumber)}</p><p>Our team will review your concern and contact you regarding the next steps. Please keep your reference number for future communication.</p><p>For urgent assistance, contact <a href="mailto:info@voltaleltd.com">info@voltaleltd.com</a> or +250 791 689 396.</p></div>`;
    let internalStatus = complaint.emailDeliveryStatus;
    let acknowledgementStatus = complaint.acknowledgementStatus;
    let deliveryError = null;
    try { await sendEmail({ to: INTERNAL_RECIPIENT, subject, html: internalHtml }); internalStatus = 'Sent'; } catch (error) { internalStatus = 'Failed'; deliveryError = error.message; }
    try { await sendEmail({ to: complaint.email, subject: `We received your Elevata complaint ${complaint.referenceNumber}`, html: acknowledgementHtml }); acknowledgementStatus = 'Sent'; } catch (error) { acknowledgementStatus = 'Failed'; deliveryError = deliveryError || error.message; }
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.complaint.update({ where: { id }, data: { emailDeliveryStatus: internalStatus, acknowledgementStatus, emailDeliveryError: deliveryError } });
      await tx.complaintAudit.create({ data: { complaintId: id, actorId, action: 'Email delivery retried', notes: deliveryError || 'Email delivery accepted by provider' } });
      return result;
    });
    if (internalStatus === 'Failed' || acknowledgementStatus === 'Failed') throw new AppError('Complaint email delivery is still failing. The record has been preserved.', 502);
    return updated;
  }

  async getEvidence(complaintId, evidenceId) {
    const evidence = await prisma.complaintEvidence.findFirst({ where: { id: evidenceId, complaintId } });
    if (!evidence) throw new AppError('Evidence not found.', 404);
    return evidence;
  }
}

export default new ComplaintService();