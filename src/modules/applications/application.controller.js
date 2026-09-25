import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '../../config/prisma.js';
import { AppError } from '../../utils/errors.js';
import { successResponse } from '../../utils/response.js';

const applicationInclude = {
  documents: {
    orderBy: { uploadedAt: 'asc' },
    select: {
      id: true,
      documentType: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true
    }
  },
  opportunity: true,
  business: { include: { user: { select: { email: true, phone: true } } } }
};

const removeUploadedFiles = async (files = []) => {
  await Promise.all(files.filter((file) => file.path).map((file) => fs.unlink(file.path).catch(() => undefined)));
};

const serializeApplication = (application) => ({
  id: application.id,
  opportunityId: application.opportunityId,
  opportunityTitle: application.opportunity.title,
  institution: application.opportunity.institution,
  businessId: application.businessId,
  smeId: application.businessId,
  smeName: application.business.businessName,
  smeSector: application.business.businessType,
  status: application.status,
  requestedAmount: application.requestedAmount,
  purpose: application.purpose,
  termMonths: application.termMonths,
  contactPhone: application.contactPhone || application.business.user.phone,
  contactEmail: application.contactEmail || application.business.user.email,
  notes: application.notes,
  feedback: application.feedback || 'Application received. Pending review by the financial institution.',
  appliedAt: application.submittedAt.toISOString().slice(0, 10),
  submittedAt: application.submittedAt,
  documents: application.documents.map((document) => ({
    id: document.id,
    documentType: document.documentType,
    name: document.documentType,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    uploadedAt: document.uploadedAt,
    downloadUrl: `/applications/${application.id}/documents/${document.id}`
  }))
});

class ApplicationController {
  async createApplication(req, res) {
    const files = req.files || [];
    try {
      const business = await prisma.business.findUnique({ where: { userId: req.user.id } });
      if (!business) throw new AppError('Complete your business profile before applying.', 400);

      const opportunity = await prisma.opportunity.findUnique({ where: { id: req.body.opportunityId } });
      if (!opportunity || opportunity.status !== 'Active') {
        throw new AppError('This opportunity is unavailable or closed.', 404);
      }

      let documentTypes;
      try {
        documentTypes = JSON.parse(req.body.documentTypes || '[]');
      } catch {
        throw new AppError('Document metadata is invalid.', 400);
      }

      if (!Array.isArray(documentTypes) || documentTypes.length !== files.length) {
        throw new AppError('Each uploaded file must include a matching document type.', 400);
      }

      const missing = opportunity.requiredDocs.filter((required) => !documentTypes.includes(required));
      if (missing.length) {
        throw new AppError(`Missing required documents: ${missing.join(', ')}`, 400);
      }

      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.financingApplication.create({
          data: {
            opportunityId: opportunity.id,
            businessId: business.id,
            requestedAmount: req.body.requestedAmount ? Number(req.body.requestedAmount) : null,
            purpose: req.body.purpose || null,
            termMonths: req.body.termMonths ? Number(req.body.termMonths) : null,
            contactPhone: req.body.contactPhone || null,
            contactEmail: req.body.contactEmail || null,
            notes: req.body.notes || null,
            documents: {
              create: files.map((file, index) => ({
                documentType: documentTypes[index],
                fileName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                storageKey: `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
                content: file.buffer
              }))
            }
          },
          include: applicationInclude
        });

        await tx.opportunity.update({
          where: { id: opportunity.id },
          data: { applicationsCount: { increment: 1 } }
        });
        return created;
      });

      return successResponse(res, 'Application and documents submitted securely.', serializeApplication(application), 201);
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
  }

  async getMyApplications(req, res) {
    const business = await prisma.business.findUnique({ where: { userId: req.user.id } });
    if (!business) return successResponse(res, 'Applications retrieved.', []);

    const applications = await prisma.financingApplication.findMany({
      where: { businessId: business.id },
      include: applicationInclude,
      orderBy: { submittedAt: 'desc' }
    });
    return successResponse(res, 'Applications retrieved.', applications.map(serializeApplication));
  }

  async getApplications(req, res) {
    const applications = await prisma.financingApplication.findMany({
      include: applicationInclude,
      orderBy: { submittedAt: 'desc' }
    });
    return successResponse(res, 'Bank application portfolio retrieved.', applications.map(serializeApplication));
  }

  async updateStatus(req, res) {
    const allowedStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected'];
    const { status, feedback } = req.body;
    if (!allowedStatuses.includes(status)) throw new AppError('Invalid application status.', 400);
    if (!feedback?.trim()) throw new AppError('A formal review note is required.', 400);

    const application = await prisma.financingApplication.update({
      where: { id: req.params.id },
      data: { status, feedback: feedback.trim() },
      include: applicationInclude
    });
    return successResponse(res, 'Application decision saved.', serializeApplication(application));
  }

  async downloadDocument(req, res) {
    const document = await prisma.applicationDocument.findFirst({
      where: { id: req.params.documentId, applicationId: req.params.id },
      include: { application: { include: { business: true } } }
    });
    if (!document) throw new AppError('Document not found.', 404);

    const ownsDocument = document.application.business.userId === req.user.id;
    const canReview = ['FINANCIAL_INSTITUTION', 'ADMIN'].includes(req.user.role);
    if (!ownsDocument && !canReview) throw new AppError('You cannot access this document.', 403);

    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'unsafe-inline'; sandbox");
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(document.fileName)}`);
    if (document.content) {
      return res.send(document.content);
    }

    // Backward compatibility for files uploaded before database-backed storage.
    const filePath = path.resolve(process.cwd(), 'uploads', 'applications', path.basename(document.storageKey));
    try {
      await fs.access(filePath);
    } catch {
      throw new AppError('The stored document file is unavailable.', 404);
    }
    return res.sendFile(filePath);
  }
}

export default new ApplicationController();
