import { financialDemoService } from './financialDemo.service.js';
import { financialDemoStore } from './financialDemo.store.js';
import { successResponse } from '../../utils/response.js';

class FinancialDemoController {
  // Get master seed metadata (institutions, available demo SMEs)
  async getDemoMeta(req, res) {
    const data = financialDemoStore.getAll();
    return successResponse(res, 'Demo metadata retrieved.', {
      demoSmes: data.demoSmes,
      financialInstitutions: data.financialInstitutions,
      loanProducts: data.loanProducts
    });
  }

  // --- SME ENDPOINTS ---

  async getSmeOverview(req, res) {
    const smeId = req.query.smeId || 'sme-1';
    const overview = financialDemoService.getSmeSummary(smeId);
    return successResponse(res, 'SME loan dashboard overview retrieved.', overview);
  }

  async getSmeLoans(req, res) {
    const smeId = req.query.smeId || 'sme-1';
    const loans = financialDemoService.getSmeLoans(smeId);
    return successResponse(res, 'SME loans retrieved.', loans);
  }

  async getLoanDetails(req, res) {
    const { loanId } = req.params;
    const loan = financialDemoService.getLoanById(loanId);
    return successResponse(res, 'Loan details retrieved.', loan);
  }

  async getLoanStatement(req, res) {
    const { loanId } = req.params;
    const statementData = financialDemoService.getLoanStatement(loanId);
    return successResponse(res, 'Loan statement retrieved.', statementData);
  }

  async repayLoan(req, res) {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    const result = await financialDemoService.processRepayment({
      ...req.body,
      idempotencyKey
    });
    return successResponse(res, 'Repayment transaction processed.', result);
  }

  // --- FI ENDPOINTS ---

  async getFiOverview(req, res) {
    const fiId = req.query.fiId || null;
    const overview = financialDemoService.getFiSummary(fiId);
    return successResponse(res, 'FI portfolio overview retrieved.', overview);
  }

  async getFiApplications(req, res) {
    const fiId = req.query.fiId || null;
    const applications = financialDemoService.getFiApplications(fiId);
    return successResponse(res, 'FI loan applications retrieved.', applications);
  }

  async getFiLoans(req, res) {
    const fiId = req.query.fiId || null;
    const loans = financialDemoService.getFiLoans(fiId);
    return successResponse(res, 'FI loan portfolio retrieved.', loans);
  }

  async underwriteApplication(req, res) {
    const { applicationId } = req.params;
    const result = await financialDemoService.underwriteApplication({
      applicationId,
      ...req.body
    });
    return successResponse(res, 'Application underwritten successfully.', result);
  }

  async disburseLoan(req, res) {
    const { loanId } = req.params;
    const result = await financialDemoService.disburseLoan({
      loanId,
      ...req.body
    });
    return successResponse(res, 'Loan disbursement processed.', result);
  }

  // --- MARKETPLACE & SERVICES ---

  async getServices(req, res) {
    const { category } = req.query;
    const services = financialDemoService.getServices(category);
    return successResponse(res, 'Digital financial services retrieved.', services);
  }

  async publishService(req, res) {
    const service = await financialDemoService.publishService(req.body);
    return successResponse(res, 'Service published successfully.', service);
  }

  async updateService(req, res) {
    const { serviceId } = req.params;
    const updated = await financialDemoService.updateService(serviceId, req.body);
    return successResponse(res, 'Service updated successfully.', updated);
  }

  async connectService(req, res) {
    const result = await financialDemoService.connectService(req.body);
    return successResponse(res, 'Service connection processed.', result);
  }

  // --- API MONITOR TELEMETRY ---

  async getApiLogs(req, res) {
    const { limit, provider, status } = req.query;
    const logs = financialDemoService.getApiLogs({ limit, provider, status });
    return successResponse(res, 'API integration telemetry logs retrieved.', logs);
  }

  async simulateCategoryHandshake(req, res) {
    try {
      const result = await financialDemoService.simulateCategoryHandshake(req.body || {});
      return successResponse(res, 'Simulated category API handshake executed.', result);
    } catch (err) {
      console.error('simulateCategoryHandshake error:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  // --- DEMO RESET ---

  async resetDemo(req, res) {
    const resetResult = financialDemoService.resetDemo();
    return successResponse(res, 'Sandbox demo environment reset to default state.', resetResult);
  }
}

export default new FinancialDemoController();
