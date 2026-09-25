import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import applicationController from './application.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { AppError } from '../../utils/errors.js';

const router = Router();

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/heic',
  'image/heif',
  'text/csv',
  'text/plain',
  'application/rtf',
  'text/rtf',
  'application/json',
  'application/xml',
  'text/xml',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm'
]);
const allowedExtensions = new Set([
  '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.heic', '.heif',
  '.csv', '.txt', '.rtf', '.json', '.xml',
  '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.mp3', '.wav', '.ogg', '.mp4', '.webm'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
      return callback(new AppError('Unsupported file. Upload a PDF, image, Office document, CSV, text, audio, or MP4/WebM video up to 10 MB.', 400));
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
