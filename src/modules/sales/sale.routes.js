import { Router } from 'express';
import saleController from './sale.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', saleController.getSales);
router.post('/', saleController.recordSale);
router.get('/:id', saleController.getSaleById);
router.delete('/:id', saleController.deleteSale);

export default router;
