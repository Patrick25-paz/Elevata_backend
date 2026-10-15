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

const normalizeApplicationStatus = (status) => {
  const value = (status || '').toString().trim();
  if (!value) return 'Under Review';
  const lower = value.toLowerCase();
  if (['submitted', 'pending', 'under review', 'under_review', 'in progress', 'review'].includes(lower)) return 'Under Review';
  if (['approved', 'completed'].includes(lower)) return 'Approved';
  if (lower === 'disbursed') return 'Disbursed';
  if (['rejected', 'declined', 'denied'].includes(lower)) return 'Rejected';
  return 'Under Review';
};

const serializeApplication = (application) => ({
  id: application.id,
  opportunityId: application.opportunityId,
  opportunityTitle: application.opportunity?.title || 'Financing Program',
  institution: application.opportunity?.institution || 'Financial Institution',
  businessId: application.businessId,
  smeId: application.businessId,
  smeName: application.business?.businessName || 'Business Applicant',
  smeSector: application.business?.businessType || 'General Business',
  status: normalizeApplicationStatus(application.status),
  requestedAmount: application.requestedAmount,
  purpose: application.purpose,
  termMonths: application.termMonths,
  contactPhone: application.contactPhone || application.business?.user?.phone || '',
  contactEmail: application.contactEmail || application.business?.user?.email || '',
  receivingAccountType: application.receivingAccountType,
  receivingBank: application.receivingBank,
  receivingAccountNumber: application.receivingAccountNumber,
  receivingMobileProvider: application.receivingMobileProvider,
  receivingMobileNumber: application.receivingMobileNumber,
  notes: application.notes,
  feedback: application.feedback || 'Application received. Pending review by the financial institution.',
  appliedAt: application.submittedAt ? application.submittedAt.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
  submittedAt: application.submittedAt || new Date(),
  documents: (application.documents || []).map((document) => ({
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
      let business = await prisma.business.findUnique({ where: { userId: req.user.id } });
      if (!business) {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (user && user.role === 'BUSINESS') {
          business = await prisma.business.create({
            data: {
              userId: user.id,
              businessName: req.body.businessName || user.name || 'SME Enterprise',
              ownerName: user.name || 'Business Owner',
              businessType: 'Retail & Wholesale',
              province: 'Kigali City',
              district: 'Gasabo',
              sector: 'Kimironko',
              cell: 'Kibagabaga',
              village: 'Nyirabwana',
              latitude: -1.9441,
              longitude: 30.0619
            }
          });
        }
      }
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

      const normalizedUploadedTypes = new Set(documentTypes.map((t) => (t || '').toString().trim().toLowerCase()));
      const missing = (opportunity.requiredDocs || []).filter(
        (required) => !normalizedUploadedTypes.has((required || '').toString().trim().toLowerCase())
      );
      if (missing.length) {
        throw new AppError(`Missing required documents: ${missing.join(', ')}`, 400);
      }

      // Check if an application already exists for this opportunity & business
      const existingApplication = await prisma.financingApplication.findUnique({
        where: {
          opportunityId_businessId: {
            opportunityId: opportunity.id,
            businessId: business.id
          }
        },
        include: applicationInclude
      });

      if (existingApplication) {
        const updated = await prisma.$transaction(async (tx) => {
          const app = await tx.financingApplication.update({
            where: { id: existingApplication.id },
            data: {
              status: existingApplication.status === 'Rejected' ? 'Under Review' : existingApplication.status,
              requestedAmount: req.body.requestedAmount ? Number(req.body.requestedAmount) : existingApplication.requestedAmount,
              purpose: req.body.purpose || existingApplication.purpose,
              termMonths: req.body.termMonths ? Number(req.body.termMonths) : existingApplication.termMonths,
              contactPhone: req.body.contactPhone || existingApplication.contactPhone,
              contactEmail: req.body.contactEmail || existingApplication.contactEmail,
              receivingAccountType: req.body.receivingAccountType || existingApplication.receivingAccountType,
              receivingBank: req.body.receivingBank || existingApplication.receivingBank,
              receivingAccountNumber: req.body.receivingAccountNumber || existingApplication.receivingAccountNumber,
              receivingMobileProvider: req.body.receivingMobileProvider || existingApplication.receivingMobileProvider,
              receivingMobileNumber: req.body.receivingMobileNumber || existingApplication.receivingMobileNumber,
              notes: req.body.notes || existingApplication.notes,
              documents: files.length > 0 ? {
                create: files.map((file, index) => ({
                  documentType: documentTypes[index] || file.originalname,
                  fileName: file.originalname,
                  mimeType: file.mimetype,
                  sizeBytes: file.size,
                  storageKey: `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
                  content: file.buffer
                }))
              } : undefined
            },
            include: applicationInclude
          });
          return app;
        }, {
          maxWait: 15000,
          timeout: 45000
        });

        return successResponse(res, 'Application dossier updated and submitted successfully.', serializeApplication(updated), 200);
      }

      const application = await prisma.$transaction(async (tx) => {
        const created = await tx.financingApplication.create({
          data: {
            opportunityId: opportunity.id,
            businessId: business.id,
            status: 'Under Review',
            requestedAmount: req.body.requestedAmount ? Number(req.body.requestedAmount) : null,
            purpose: req.body.purpose || null,
            termMonths: req.body.termMonths ? Number(req.body.termMonths) : null,
            contactPhone: req.body.contactPhone || null,
            contactEmail: req.body.contactEmail || null,
            receivingAccountType: req.body.receivingAccountType || null,
            receivingBank: req.body.receivingBank || null,
            receivingAccountNumber: req.body.receivingAccountNumber || null,
            receivingMobileProvider: req.body.receivingMobileProvider || null,
            receivingMobileNumber: req.body.receivingMobileNumber || null,
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
      }, {
        maxWait: 15000,
        timeout: 45000
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
    const allowedStatuses = ['Under Review', 'Approved', 'Rejected', 'Disbursed'];
    const { status, feedback } = req.body;
    const normalizedStatus = normalizeApplicationStatus(status);
    if (!allowedStatuses.includes(normalizedStatus)) throw new AppError('Invalid application status.', 400);
    if (!feedback?.trim()) throw new AppError('A formal review note is required.', 400);

    const application = await prisma.financingApplication.update({
      where: { id: req.params.id },
      data: { status: normalizedStatus, feedback: feedback.trim() },
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

  async addDocuments(req, res) {
    const files = req.files || [];
    try {
      const business = await prisma.business.findUnique({ where: { userId: req.user.id } });
      if (!business) throw new AppError('Complete your business profile before managing documents.', 400);

      const application = await prisma.financingApplication.findFirst({
        where: { id: req.params.id, businessId: business.id }
      });
      if (!application) throw new AppError('Application not found or unauthorized.', 404);

      if (!files.length) throw new AppError('No document files provided.', 400);

      let documentTypes = [];
      try {
        documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes) : [];
      } catch {
        documentTypes = [];
      }

      await prisma.$transaction(async (tx) => {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const docType = documentTypes[i] || file.originalname;
          await tx.applicationDocument.create({
            data: {
              applicationId: application.id,
              documentType: docType,
              fileName: file.originalname,
              mimeType: file.mimetype,
              sizeBytes: file.size,
              storageKey: `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
              content: file.buffer
            }
          });
        }
      });

      const updated = await prisma.financingApplication.findUnique({
        where: { id: application.id },
        include: applicationInclude
      });
      return successResponse(res, 'Documents uploaded successfully.', serializeApplication(updated));
    } catch (error) {
      await removeUploadedFiles(files);
      throw error;
    }
  }
}

export default new ApplicationController();
