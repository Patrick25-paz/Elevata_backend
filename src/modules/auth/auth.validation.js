import { z } from 'zod';

// Allowed business types for SMEs
export const ALLOWED_BUSINESS_TYPES = [
  'Retail Shop',
  'Wholesale',
  'Restaurant',
  'Hotel',
  'Agriculture',
  'Manufacturing',
  'Construction',
  'Transport',
  'Education',
  'Healthcare',
  'ICT',
  'Finance',
  'Pharmacy',
  'Salon',
  'Fashion',
  'Electronics',
  'Hardware Store',
  'Supermarket',
  'Stationery',
  'Printing',
  'Other'
];

// Allowed categories for Financial Institutions
export const ALLOWED_INSTITUTION_CATEGORIES = [
  'Commercial Bank',
  'Microfinance Institution',
  'Development Bank',
  'SACCO',
  'Fintech / Mobile Money Provider',
  'Insurance Company',
  'Investment Fund',
  'Other'
];

// Allowed scopes of operation
export const ALLOWED_OPERATING_SCOPES = [
  'Rwanda',
  'Africa',
  'Worldwide'
];

// Strong password regex requirement
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

// Base registration inputs shared by both roles
const baseRegisterSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  phone: z.string().trim().regex(/^(\+?[0-9\s-]{9,15})$/, 'Phone number must be a valid format (9 to 15 digits)'),
  password: z.string().min(8, 'Password must be at least 8 characters').regex(
    strongPasswordRegex,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
});

// SME Registration schema (Requires location and coordinates)
const smeSchema = baseRegisterSchema.extend({
  registrationType: z.literal('SME'),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().trim().min(2, 'Owner name must be at least 2 characters'),
  businessType: z.enum(ALLOWED_BUSINESS_TYPES, {
    errorMap: () => ({ message: `Business type must be one of: ${ALLOWED_BUSINESS_TYPES.join(', ')}` })
  }),
  province: z.string().trim().min(1, 'Province is required'),
  district: z.string().trim().min(1, 'District is required'),
  sector: z.string().trim().min(1, 'Sector is required'),
  cell: z.string().trim().min(1, 'Cell is required'),
  village: z.string().trim().min(1, 'Village is required'),
  knownPlace: z.string().trim().optional(),
  latitude: z.coerce
    .number({ invalid_type_error: 'Latitude must be a valid number' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce
    .number({ invalid_type_error: 'Longitude must be a valid number' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
});

// Financial Institution Registration schema (Does not require location/coordinates)
const fiSchema = baseRegisterSchema.extend({
  registrationType: z.literal('FINANCIAL_INSTITUTION'),
  institutionName: z.string().trim().min(2, 'Institution name must be at least 2 characters'),
  representativeName: z.string().trim().min(2, 'Representative name must be at least 2 characters'),
  category: z.enum(ALLOWED_INSTITUTION_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${ALLOWED_INSTITUTION_CATEGORIES.join(', ')}` })
  }),
  operatingScope: z.enum(ALLOWED_OPERATING_SCOPES, {
    errorMap: () => ({ message: `Operating scope must be one of: ${ALLOWED_OPERATING_SCOPES.join(', ')}` })
  }),
  licenseNumber: z.string().trim().min(2, 'License number must be at least 2 characters'),
  website: z.string().trim().url('Invalid website URL').or(z.literal('')).optional()
});

// Discriminated union to validate registration request bodies based on 'registrationType'
export const registerSchema = z.discriminatedUnion('registrationType', [smeSchema, fiSchema]);

// Login schema
export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});
