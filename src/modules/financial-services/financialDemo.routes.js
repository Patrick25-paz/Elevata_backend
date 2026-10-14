import { Router } from 'express';
import financialDemoController from './financialDemo.controller.js';

const router = Router();

// Metadata & seed info
router.get('/meta', financialDemoController.getDemoMeta);

// SME Loans & Statement endpoints
router.get('/sme/overview', financialDemoController.getSmeOverview);
router.get('/sme/loans', financialDemoController.getSmeLoans);
router.get('/sme/loans/:loanId', financialDemoController.getLoanDetails);
router.get('/sme/loans/:loanId/statement', financialDemoController.getLoanStatement);
router.post('/sme/loans/repay', financialDemoController.repayLoan);

// FI Underwriting & Disbursement endpoints
router.get('/fi/overview', financialDemoController.getFiOverview);
router.get('/fi/applications', financialDemoController.getFiApplications);
router.patch('/fi/applications/:applicationId/underwrite', financialDemoController.underwriteApplication);
router.post('/fi/loans/:loanId/disburse', financialDemoController.disburseLoan);

// Digital Financial Services Marketplace
router.get('/services', financialDemoController.getServices);
router.post('/services', financialDemoController.publishService);
router.patch('/services/:serviceId', financialDemoController.updateService);
router.post('/services/connect', financialDemoController.connectService);

// API Integration Monitor logs & category test handshakes
router.get('/api-logs', financialDemoController.getApiLogs);
router.post('/simulate-handshake', financialDemoController.simulateCategoryHandshake);

// Demo Environment Reset
router.post('/reset', financialDemoController.resetDemo);

export default router;
