import { z } from 'zod';

export const COMPLAINT_ROLES = [
  'SME / Business Owner',
  'Financial Institution Representative',
  'Payment Service Provider',
  'Other'
];

export const COMPLAINT_CATEGORIES = [
  'Technical Issue / Platform Access',
  'Loan Application or Lending Concern',
  'Payment or Loan Repayment Issue',
  'Banking or Digital Financial Service',
  'Insurance Service',
  'Data Privacy or Security Concern',
  'Staff Conduct or Communication',
  'Other'
];

export const COMPLAINT_STATUSES = [
  'Received',
  'Under Review',
  'Awaiting Information',
  'Referred to Partner',
  'Resolved',
  'Closed'
];

export const complaintSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  organizationName: z.string().trim().max(160).optional().or(z.literal('')),
  role: z.enum(COMPLAINT_ROLES),
  category: z.enum(COMPLAINT_CATEGORIES),
  relatedInstitution: z.string().trim().max(160).optional().or(z.literal('')),
  transactionReference: z.string().trim().max(120).optional().or(z.literal('')),
  subject: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(10000),
  preferredResolution: z.string().trim().max(5000).optional().or(z.literal('')),
  confirmation: z.literal('true', { errorMap: () => ({ message: 'Confirmation is required' }) }),
  website: z.string().max(0).optional().or(z.literal(''))
});

export const complaintAdminUpdateSchema = z.object({
  status: z.enum(COMPLAINT_STATUSES).optional(),
  severity: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  assignedTo: z.string().trim().max(120).optional().or(z.literal('')),
  internalNotes: z.string().trim().max(10000).optional().or(z.literal('')),
  resolutionDetails: z.string().trim().max(10000).optional().or(z.literal(''))
});