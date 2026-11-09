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

const parseApplicationNotes = (rawNotes) => {
  if (!rawNotes) return { applicantNotes: '', payments: [] };
  if (typeof rawNotes === 'object' && rawNotes !== null) return rawNotes;
  try {
    const parsed = JSON.parse(rawNotes);
    if (typeof parsed === 'object' && parsed !== null) {
      return {
        applicantNotes: parsed.applicantNotes || '',
        approvedAmount: parsed.approvedAmount !== undefined ? Number(parsed.approvedAmount) : null,
        interestRate: parsed.interestRate !== undefined ? Number(parsed.interestRate) : null,
        termMonths: parsed.termMonths !== undefined ? Number(parsed.termMonths) : null,
        monthlyInstallment: parsed.monthlyInstallment !== undefined ? Number(parsed.monthlyInstallment) : null,
        totalPayable: parsed.totalPayable !== undefined ? Number(parsed.totalPayable) : null,
        totalPaid: parsed.totalPaid !== undefined ? Number(parsed.totalPaid) : 0,
        remainingBalance: parsed.remainingBalance !== undefined ? Number(parsed.remainingBalance) : null,
        nextDueDate: parsed.nextDueDate || null,
        disbursed: Boolean(parsed.disbursed),
        disbursedAt: parsed.disbursedAt || null,
        disbursedAmount: parsed.disbursedAmount !== undefined ? Number(parsed.disbursedAmount) : null,
        disbursementRef: parsed.disbursementRef || null,
        payments: Array.isArray(parsed.payments) ? parsed.payments : []
      };
    }
  } catch {
    // rawNotes is plain text
  }
  return {
    applicantNotes: String(rawNotes || ''),
    payments: []
  };
};

const calculateFinancialMetrics = (data, requestedAmount, requestedTerm) => {
  const principal = Number(data.approvedAmount ?? requestedAmount ?? 5000000);
  const rate = Number(data.interestRate ?? 12);
  const term = Number(data.termMonths ?? requestedTerm ?? 12);

  const interestTotal = Math.round(principal * (rate / 100) * (term / 12));
  const totalPayable = Math.round(principal + interestTotal);
  const monthlyInstallment = Math.round(totalPayable / (term || 1));

  const totalPaid = Number(data.totalPaid ?? 0);
  const remainingBalance = data.remainingBalance !== undefined && data.remainingBalance !== null
    ? Math.max(0, Number(data.remainingBalance))
    : Math.max(0, totalPayable - totalPaid);

  return {
    approvedAmount: principal,
    interestRate: rate,
    termMonths: term,
    monthlyInstallment: Number(data.monthlyInstallment) || monthlyInstallment,
    totalPayable: Number(data.totalPayable) || totalPayable,
    totalPaid,
    remainingBalance
  };
};

const serializeApplication = (application) => {
  const parsed = parseApplicationNotes(application.notes);

  let financialInfo = {};
  if (['Approved', 'Disbursed', 'Completed'].includes(application.status)) {
    financialInfo = calculateFinancialMetrics(
      parsed,
      application.requestedAmount,
      application.termMonths
    );
  } else {
    financialInfo = {
      approvedAmount: parsed.approvedAmount ?? null,
      interestRate: parsed.interestRate ?? null,
      termMonths: parsed.termMonths ?? application.termMonths ?? null,
      monthlyInstallment: parsed.monthlyInstallment ?? null,
      totalPayable: parsed.totalPayable ?? null,
      totalPaid: parsed.totalPaid ?? 0,
      remainingBalance: parsed.remainingBalance ?? null
    };
  }

  let nextDueDate = parsed.nextDueDate;
  if (!nextDueDate && ['Approved', 'Disbursed'].includes(application.status)) {
    const due = new Date(application.updatedAt || application.submittedAt);
    due.setDate(due.getDate() + 30);
    nextDueDate = due.toISOString().slice(0, 10);
  }

  return {
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
    termMonths: financialInfo.termMonths || application.termMonths,
    contactPhone: application.contactPhone || application.business.user.phone,
    contactEmail: application.contactEmail || application.business.user.email,
    notes: parsed.applicantNotes || (typeof application.notes === 'string' ? application.notes : ''),
    applicantNotes: parsed.applicantNotes || '',
    feedback: application.feedback || 'Application received. Pending review by the financial institution.',
    appliedAt: application.submittedAt.toISOString().slice(0, 10),
    submittedAt: application.submittedAt,

    approvedAmount: financialInfo.approvedAmount,
    interestRate: financialInfo.interestRate,
    monthlyInstallment: financialInfo.monthlyInstallment,
    totalPayable: financialInfo.totalPayable,
    totalPaid: financialInfo.totalPaid,
    remainingBalance: financialInfo.remainingBalance,
    nextDueDate,
    disbursed: Boolean(parsed.disbursed),
    disbursedAt: parsed.disbursedAt ?? null,
    disbursedAmount: parsed.disbursedAmount ?? financialInfo.approvedAmount,
    disbursementRef: parsed.disbursementRef ?? null,
    payments: parsed.payments || [],

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
  };
};

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
    const allowedStatuses = ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Disbursed', 'Completed'];
    const {
      status,
      feedback,
      approvedAmount,
      interestRate,
      termMonths,
      monthlyInstallment,
      disburseNow
    } = req.body;
    if (!allowedStatuses.includes(status)) throw new AppError('Invalid application status.', 400);
    if (!feedback?.trim()) throw new AppError('A formal review note is required.', 400);

    const existing = await prisma.financingApplication.findUnique({
      where: { id: req.params.id },
      include: applicationInclude
    });
    if (!existing) throw new AppError('Application not found.', 404);

    const notesMeta = parseApplicationNotes(existing.notes);

    if (['Approved', 'Disbursed', 'Completed'].includes(status)) {
      const financial = calculateFinancialMetrics(
        {
          ...notesMeta,
          approvedAmount: approvedAmount !== undefined ? Number(approvedAmount) : notesMeta.approvedAmount,
          interestRate: interestRate !== undefined ? Number(interestRate) : notesMeta.interestRate,
          termMonths: termMonths !== undefined ? Number(termMonths) : notesMeta.termMonths,
          monthlyInstallment: monthlyInstallment !== undefined ? Number(monthlyInstallment) : notesMeta.monthlyInstallment
        },
        existing.requestedAmount,
        existing.termMonths
      );

      notesMeta.approvedAmount = financial.approvedAmount;
      notesMeta.interestRate = financial.interestRate;
      notesMeta.termMonths = financial.termMonths;
      notesMeta.monthlyInstallment = financial.monthlyInstallment;
      notesMeta.totalPayable = financial.totalPayable;
      notesMeta.totalPaid = financial.totalPaid;
      notesMeta.remainingBalance = financial.remainingBalance;

      if (!notesMeta.nextDueDate) {
        const nextDue = new Date();
        nextDue.setDate(nextDue.getDate() + 30);
        notesMeta.nextDueDate = nextDue.toISOString().slice(0, 10);
      }

      if (disburseNow && !notesMeta.disbursed) {
        notesMeta.disbursed = true;
        notesMeta.disbursedAt = new Date().toISOString();
        notesMeta.disbursedAmount = financial.approvedAmount;
        notesMeta.disbursementRef = `DISB-${randomUUID().slice(0, 8).toUpperCase()}`;

        await prisma.businessLedgerEntry.create({
          data: {
            businessId: existing.businessId,
            kind: 'loan_disbursement',
            amount: financial.approvedAmount,
            category: 'Financing Inflow',
            description: `Loan Disbursement Received - ${existing.opportunity.title} [Ref: ${notesMeta.disbursementRef}]`,
            counterparty: existing.opportunity.institution,
            paymentMethod: 'Bank Transfer',
            status: 'Completed',
            metadata: {
              applicationId: existing.id,
              disbursementRef: notesMeta.disbursementRef
            },
            occurredAt: new Date()
          }
        }).catch(err => console.warn('Ledger disbursement entry warning:', err));
      }
    }

    const application = await prisma.financingApplication.update({
      where: { id: req.params.id },
      data: {
        status,
        feedback: feedback.trim(),
        notes: JSON.stringify(notesMeta)
      },
      include: applicationInclude
    });
    return successResponse(res, 'Application decision saved.', serializeApplication(application));
  }

  async createPayment(req, res) {
    const { id } = req.params;
    const { amount, paymentMethod, reference, phoneNumber, notes } = req.body;

    if (!amount || Number(amount) <= 0) {
      throw new AppError('A valid payment amount is required.', 400);
    }

    const existing = await prisma.financingApplication.findUnique({
      where: { id },
      include: applicationInclude
    });
    if (!existing) throw new AppError('Application not found.', 404);

    const isOwner = existing.business.userId === req.user.id;
    const isFIorAdmin = ['FINANCIAL_INSTITUTION', 'ADMIN'].includes(req.user.role);
    if (!isOwner && !isFIorAdmin) {
      throw new AppError('You are not authorized to make or record payments on this application.', 403);
    }

    if (!['Approved', 'Disbursed'].includes(existing.status)) {
      throw new AppError('Payments can only be made on Approved or Disbursed financing.', 400);
    }

    const notesMeta = parseApplicationNotes(existing.notes);
    const financial = calculateFinancialMetrics(notesMeta, existing.requestedAmount, existing.termMonths);

    const paymentAmount = Number(amount);
    const newTotalPaid = financial.totalPaid + paymentAmount;
    const newRemainingBalance = Math.max(0, financial.totalPayable - newTotalPaid);

    const paymentId = `pay-${randomUUID().slice(0, 8)}`;
    const paymentRef = reference?.trim() || `PAY-${Date.now().toString(36).toUpperCase()}`;
    const payerName = isOwner
      ? (existing.business.ownerName || existing.business.businessName || 'SME Borrower')
      : 'Bank Officer (Direct Ledger Record)';

    const paymentRecord = {
      id: paymentId,
      amount: paymentAmount,
      method: paymentMethod || 'Mobile Money',
      reference: paymentRef,
      phoneNumber: phoneNumber || existing.contactPhone || '',
      paidAt: new Date().toISOString(),
      paidBy: payerName,
      status: 'Completed',
      notes: notes || 'Loan installment repayment'
    };

    notesMeta.approvedAmount = financial.approvedAmount;
    notesMeta.interestRate = financial.interestRate;
    notesMeta.termMonths = financial.termMonths;
    notesMeta.monthlyInstallment = financial.monthlyInstallment;
    notesMeta.totalPayable = financial.totalPayable;
    notesMeta.totalPaid = newTotalPaid;
    notesMeta.remainingBalance = newRemainingBalance;
    notesMeta.payments = [paymentRecord, ...(notesMeta.payments || [])];

    let updatedStatus = existing.status;
    if (newRemainingBalance <= 0) {
      updatedStatus = 'Completed';
    } else {
      const currentNextDue = notesMeta.nextDueDate ? new Date(notesMeta.nextDueDate) : new Date();
      currentNextDue.setDate(currentNextDue.getDate() + 30);
      notesMeta.nextDueDate = currentNextDue.toISOString().slice(0, 10);
    }

    const application = await prisma.financingApplication.update({
      where: { id },
      data: {
        status: updatedStatus,
        notes: JSON.stringify(notesMeta)
      },
      include: applicationInclude
    });

    await prisma.businessLedgerEntry.create({
      data: {
        businessId: existing.businessId,
        kind: 'loan_repayment',
        amount: paymentAmount,
        category: 'Loan Repayment',
        description: `Loan Repayment (${paymentRecord.method}) - ${existing.opportunity.title} [Ref: ${paymentRef}]`,
        counterparty: existing.opportunity.institution,
        paymentMethod: paymentRecord.method,
        status: 'Completed',
        metadata: {
          applicationId: existing.id,
          paymentId: paymentRecord.id,
          reference: paymentRef,
          remainingBalance: newRemainingBalance
        },
        occurredAt: new Date()
      }
    }).catch(err => console.warn('Ledger repayment entry warning:', err));

    return successResponse(
      res,
      `Payment of ${paymentAmount.toLocaleString()} RWF processed successfully.`,
      serializeApplication(application)
    );
  }

  async disburseApplication(req, res) {
    const { id } = req.params;
    const { disbursedAmount, notes } = req.body;

    const existing = await prisma.financingApplication.findUnique({
      where: { id },
      include: applicationInclude
    });
    if (!existing) throw new AppError('Application not found.', 404);

    if (existing.status !== 'Approved' && existing.status !== 'Disbursed') {
      throw new AppError('Only Approved applications can be disbursed.', 400);
    }

    const notesMeta = parseApplicationNotes(existing.notes);
    const financial = calculateFinancialMetrics(notesMeta, existing.requestedAmount, existing.termMonths);

    const amount = Number(disbursedAmount) || financial.approvedAmount;
    notesMeta.disbursed = true;
    notesMeta.disbursedAt = new Date().toISOString();
    notesMeta.disbursedAmount = amount;
    notesMeta.disbursementRef = `DISB-${randomUUID().slice(0, 8).toUpperCase()}`;

    if (!notesMeta.nextDueDate) {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 30);
      notesMeta.nextDueDate = nextDue.toISOString().slice(0, 10);
    }

    const application = await prisma.financingApplication.update({
      where: { id },
      data: {
        status: 'Approved',
        feedback: notes ? `${existing.feedback || ''}\nDisbursement note: ${notes}`.trim() : existing.feedback,
        notes: JSON.stringify(notesMeta)
      },
      include: applicationInclude
    });

    await prisma.businessLedgerEntry.create({
      data: {
        businessId: existing.businessId,
        kind: 'loan_disbursement',
        amount,
        category: 'Financing Inflow',
        description: `Loan Disbursement Released - ${existing.opportunity.title} [Ref: ${notesMeta.disbursementRef}]`,
        counterparty: existing.opportunity.institution,
        paymentMethod: 'Bank Transfer',
        status: 'Completed',
        metadata: {
          applicationId: existing.id,
          disbursementRef: notesMeta.disbursementRef
        },
        occurredAt: new Date()
      }
    }).catch(err => console.warn('Ledger disbursement entry warning:', err));

    return successResponse(res, 'Loan disbursement recorded and funds marked as released.', serializeApplication(application));
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
