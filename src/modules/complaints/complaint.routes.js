import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import complaintController from './complaint.controller.js';
import { complaintAdminUpdateSchema, complaintSchema } from './complaint.validation.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype))
});
const submissionLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many complaint submissions. Please try again later.' } });

router.post('/', authenticate, submissionLimit, upload.single('supportingEvidence'), validate(complaintSchema), complaintController.create);
router.get('/', authenticate, authorize('ADMIN'), complaintController.list);
router.patch('/:id', authenticate, authorize('ADMIN'), validate(complaintAdminUpdateSchema), complaintController.update);
router.post('/:id/retry', authenticate, authorize('ADMIN'), complaintController.retry);
router.get('/:id/evidence/:evidenceId', authenticate, authorize('ADMIN'), complaintController.evidence);

export default router;