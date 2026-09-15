import { Router } from 'express';
import aiController from './ai.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Protect all AI endpoints with authentication
router.use(authenticate);

router.post('/chat', (req, res, next) => aiController.chatWithBot(req, res, next));
router.get('/suggestions', (req, res, next) => aiController.getSuggestions(req, res, next));

export default router;
