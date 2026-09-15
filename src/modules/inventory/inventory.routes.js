import { Router } from 'express';
import productController from './product.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// All inventory/product routes require authentication
router.use(authenticate);

router.get('/products', productController.getProducts);
router.post('/products', productController.createProduct);
router.get('/products/:id', productController.getProductById);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

router.post('/stock-intake', productController.recordStockIntake);
router.get('/stock-intakes', productController.getStockIntakes);

export default router;
