import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import applicationController from './application.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/errors.js';

const router = Router();
const uploadDirectory = path.resolve(process.cwd(), 'uploads', 'applications');
fs.mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError('Only PDF, JPG, PNG, CSV, and XLSX documents are accepted.', 400));
    }
    callback(null, true);
  }
});

router.post(
  '/',
  authenticate,
  authorize('BUSINESS'),
  upload.array('documents', 12),
  applicationController.createApplication
);

router.get(
  '/mine',
  authenticate,
  authorize('BUSINESS'),
  applicationController.getMyApplications
);

router.get(
  '/',
  authenticate,
  authorize('FINANCIAL_INSTITUTION', 'ADMIN'),
  applicationController.getApplications
);

router.get(
  '/:id/documents/:documentId',
  authenticate,
  applicationController.downloadDocument
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('FINANCIAL_INSTITUTION', 'ADMIN'),
  applicationController.updateStatus
);

export default router;
