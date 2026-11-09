import { financialDemoStore } from './financialDemo.store.js';
import {
  momoAdapter,
  bankTransferAdapter,
  savingsAccountAdapter,
  merchantPaymentAdapter,
  insuranceAdapter,
  mobileBankingAdapter,
  digitalWalletsAdapter,
  digitalMoneyTransfersAdapter
} from './mockAdapters.js';
import { AppError } from '../../utils/errors.js';

class FinancialDemoService {
  // Idempotency cache to prevent duplicate transactions from rapid retries or double clicks
  constructor() {
    this.processedIdempotencyKeys = new Map();
  }

  // --- OVERVIEW & STATS ---

  getSmeSummary(smeId = 'sme-1') {
    const data = financialDemoStore.getAll();
    const smeLoans = data.loans.filter(l => l.smeId === smeId);
    const activeLoans = smeLoans.filter(l => l.status === 'Active');

    const totalBorrowed = smeLoans.reduce((acc, l) => acc + (l.totalBorrowed || 0), 0);
    const outstandingPrincipal = activeLoans.reduce((acc, l) => acc + (l.outstandingPrincipal || 0), 0);
    const totalRepaymentsMade = smeLoans.reduce((acc, l) => acc + (l.totalRepaymentsMade || 0), 0);
    const totalAmountDueNow = activeLoans.reduce((acc, l) => acc + (l.totalAmountDueNow || 0), 0);

    const nextLoan = activeLoans.sort((a, b) => new Date(a.nextRepaymentDueDate) - new Date(b.nextRepaymentDueDate))[0];

    const connectedServices = data.serviceConnections.filter(c => c.smeId === smeId && c.status === 'Connected').length;

    return {
      smeId,
      totalBorrowed,
      outstandingPrincipal,
      totalAmountDueNow,
      totalRepaymentsMade,
      activeLoansCount: activeLoans.length,
      nextRepaymentAmount: nextLoan ? nextLoan.monthlyInstallment : 0,
      nextRepaymentDueDate: nextLoan ? nextLoan.nextRepaymentDueDate : null,
      nextLoanReference: nextLoan ? nextLoan.referenceNumber : null,
      connectedServicesCount: connectedServices,
      demoMode: true
    };
  }

  getFiSummary(fiId) {
    const data = financialDemoStore.getAll();
    let loans = data.loans;
    let applications = data.loanApplications;
    let services = data.digitalFinancialServices;

    if (fiId) {
      loans = loans.filter(l => l.institutionId === fiId);
      applications = applications.filter(a => a.institutionId === fiId);
      services = services.filter(s => s.institutionId === fiId);
    }

    const totalDisbursed = loans.filter(l => l.disbursedAt).reduce((acc, l) => acc + l.totalBorrowed, 0);
    const totalOutstanding = loans.filter(l => l.status === 'Active').reduce((acc, l) => acc + l.outstandingPrincipal, 0);
    const totalRepaymentsCollected = loans.reduce((acc, l) => acc + l.totalRepaymentsMade, 0);
    const pendingDisbursements = loans.filter(l => l.disbursementStatus === 'Pending Disbursement').length;
    const pendingApplications = applications.filter(a => a.status === 'Submitted' || a.status === 'Under Review').length;

    return {
      fiId: fiId || 'ALL',
      totalDisbursed,
      totalOutstanding,
      totalRepaymentsCollected,
      pendingDisbursements,
      pendingApplications,
      activeLoansCount: loans.filter(l => l.status === 'Active').length,
      publishedServicesCount: services.length,
      demoMode: true
    };
  }

  // --- LOANS & STATEMENTS ---

  getSmeLoans(smeId = 'sme-1') {
    const data = financialDemoStore.getAll();
    return data.loans.filter(l => l.smeId === smeId);
  }

  getFiLoans(fiId) {
    const data = financialDemoStore.getAll();
    return fiId ? data.loans.filter(l => l.institutionId === fiId) : data.loans;
  }

  getLoanById(loanId) {
    const data = financialDemoStore.getAll();
    const loan = data.loans.find(l => l.id === loanId || l.referenceNumber === loanId);
    if (!loan) throw new AppError('Loan not found.', 404);
    return loan;
  }

  getLoanStatement(loanId) {
    const loan = this.getLoanById(loanId);
    return {
      loanId: loan.id,
      loanReference: loan.referenceNumber,
      institutionName: loan.institutionName,
      smeName: loan.smeName,
      outstandingPrincipal: loan.outstandingPrincipal,
      statement: loan.statement || []
    };
  }

  // --- LOAN REPAYMENT (SME -> Mock Provider -> Updated Loan Record) ---

  async processRepayment({
    loanId,
    amount,
    channel,
    paymentDetails,
    idempotencyKey,
    simulateOutcome = 'success'
  }) {
    if (!loanId) throw new AppError('Loan ID is required.', 400);
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new AppError('Repayment amount must be a positive number.', 400);
    }
    const normalizedChannel = (channel === 'Airtel Money' || channel === 'Mobile Money')
      ? 'Mobile Money'
      : (channel === 'Bank' || channel === 'Bank Transfer')
      ? 'Bank Transfer'
      : channel;

    if (!['Mobile Money', 'Bank Transfer'].includes(normalizedChannel)) {
      throw new AppError('Payment channel must be Mobile Money, Airtel Money, or Bank Transfer.', 400);
    }

    // Idempotency check: prevent duplicate submissions
    if (idempotencyKey) {
      if (this.processedIdempotencyKeys.has(idempotencyKey)) {
        const cached = this.processedIdempotencyKeys.get(idempotencyKey);
        return {
          ...cached,
          isDuplicateSubmission: true,
          message: 'Duplicate submission prevented. Returning previous transaction result.'
        };
      }
    }

    const data = financialDemoStore.getAll();
    const loanIndex = data.loans.findIndex(l => l.id === loanId || l.referenceNumber === loanId);
    if (loanIndex === -1) throw new AppError('Loan record not found.', 404);

    const loan = data.loans[loanIndex];
    if (loan.status !== 'Active') {
      throw new AppError(`Cannot process repayment for loan with status: "${loan.status}".`, 400);
    }

    if (numAmount > loan.outstandingPrincipal) {
      throw new AppError(`Repayment amount (${numAmount} RWF) exceeds outstanding balance (${loan.outstandingPrincipal} RWF).`, 400);
    }

    const isAirtel = channel === 'Airtel Money' || (paymentDetails?.provider && paymentDetails.provider.toLowerCase().includes('airtel'));
    const txPrefix = isAirtel ? 'AIRTEL' : (normalizedChannel === 'Mobile Money' ? 'MOMO' : 'BANK');
    const txRef = `REP-${txPrefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let providerResult;
    if (normalizedChannel === 'Mobile Money') {
      const phone = paymentDetails?.phoneNumber || '+250 788 123 456';
      const defaultProvider = isAirtel ? 'Airtel Money Rwanda' : 'MTN Mobile Money Rwanda';
      providerResult = await momoAdapter.requestToPay({
        amount: numAmount,
        phoneNumber: phone,
        reference: txRef,
        provider: paymentDetails?.provider || defaultProvider,
        simulateOutcome,
        relatedSme: `${loan.smeName} (${loan.smeId})`,
        relatedReference: loan.referenceNumber
      });
    } else {
      providerResult = await bankTransferAdapter.processTransfer({
        amount: numAmount,
        sourceAccount: paymentDetails?.accountNumber || '40032918451',
        destinationAccount: 'BK-LOAN-REPAY-ESCROW',
        bankName: paymentDetails?.bankName || loan.institutionName,
        reference: txRef,
        isDisbursement: false,
        simulateOutcome,
        relatedSme: `${loan.smeName} (${loan.smeId})`,
        relatedReference: loan.referenceNumber
      });
    }

    const isSuccess = providerResult.success;
    const isPending = providerResult.isPending;
    const txStatus = isSuccess ? 'Completed' : (isPending ? 'Pending' : 'Failed');

    // ONLY update loan balance when confirmed success!
    let newOutstanding = loan.outstandingPrincipal;
    let newRepaymentsMade = loan.totalRepaymentsMade;

    if (isSuccess) {
      newOutstanding = Math.max(0, loan.outstandingPrincipal - numAmount);
      newRepaymentsMade = loan.totalRepaymentsMade + numAmount;
      loan.outstandingPrincipal = newOutstanding;
      loan.totalRepaymentsMade = newRepaymentsMade;
      if (newOutstanding === 0) {
        loan.status = 'Fully Repaid';
        loan.totalAmountDueNow = 0;
      }
    }

    // Create statement entry
    const statementEntry = {
      id: `TXN-STMT-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().slice(0, 10),
      type: 'Repayment',
      description: `Loan repayment via ${channel} (${paymentDetails?.provider || paymentDetails?.bankName || 'Simulated'})`,
      reference: txRef,
      channel,
      debit: isSuccess ? numAmount : 0,
      credit: 0,
      runningBalance: newOutstanding,
      status: txStatus
    };
    loan.statement.unshift(statementEntry);

    // Record repayment entry in shared store
    const repaymentRecord = {
      id: `TXN-${txRef}`,
      loanId: loan.id,
      loanReference: loan.referenceNumber,
      smeId: loan.smeId,
      smeName: loan.smeName,
      institutionId: loan.institutionId,
      institutionName: loan.institutionName,
      amount: numAmount,
      channel,
      paymentDetails,
      reference: txRef,
      status: txStatus,
      timestamp: new Date().toISOString(),
      providerResponse: providerResult.data
    };
    data.repayments.unshift(repaymentRecord);

    financialDemoStore.save();

    const response = {
      success: isSuccess,
      isPending,
      status: txStatus,
      transactionReference: txRef,
      amount: numAmount,
      channel,
      loanId: loan.id,
      loanReference: loan.referenceNumber,
      updatedOutstandingBalance: loan.outstandingPrincipal,
      totalRepaymentsMade: loan.totalRepaymentsMade,
      statementEntry,
      providerData: providerResult.data
    };

    if (idempotencyKey) {
      this.processedIdempotencyKeys.set(idempotencyKey, response);
    }

    return response;
  }

  // --- LOAN DISBURSEMENT (FI -> Mock Provider -> SME Loan -> Dashboard) ---

  async disburseLoan({
    loanId,
    channel = 'Bank Transfer',
    destinationAccount,
    simulateOutcome = 'success'
  }) {
    if (!loanId) throw new AppError('Loan ID is required.', 400);

    const data = financialDemoStore.getAll();
    const loan = data.loans.find(l => l.id === loanId || l.referenceNumber === loanId);
    if (!loan) throw new AppError('Loan record not found.', 404);

    if (loan.disbursedAt && loan.status === 'Active') {
      throw new AppError('Loan has already been disbursed.', 400);
    }

    const disbRef = `DISB-${loan.institutionName.slice(0, 2).toUpperCase()}-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    let providerResult;
    if (channel === 'Mobile Money') {
      providerResult = await momoAdapter.requestToPay({
        amount: loan.totalBorrowed,
        phoneNumber: destinationAccount || '+250 788 412 890',
        reference: disbRef,
        provider: 'MTN Mobile Money Rwanda',
        simulateOutcome,
        relatedSme: `${loan.smeName} (${loan.smeId})`,
        relatedReference: loan.referenceNumber
      });
    } else {
      providerResult = await bankTransferAdapter.processTransfer({
        amount: loan.totalBorrowed,
        sourceAccount: 'BANK-TREASURY-DISBURSEMENT',
        destinationAccount: destinationAccount || '40032918451',
        bankName: loan.institutionName,
        reference: disbRef,
        isDisbursement: true,
        simulateOutcome,
        relatedSme: `${loan.smeName} (${loan.smeId})`,
        relatedReference: loan.referenceNumber
      });
    }

    const isSuccess = providerResult.success;
    const isPending = providerResult.isPending;
    const disbStatus = isSuccess ? 'Completed' : (isPending ? 'Pending' : 'Failed');

    if (isSuccess) {
      loan.status = 'Active';
      loan.disbursedAt = new Date().toISOString();
      loan.disbursementStatus = 'Completed';
      loan.disbursementChannel = channel;
      loan.disbursementReference = disbRef;
      loan.totalAmountDueNow = loan.monthlyInstallment;

      // Add disbursement statement entry
      const statementEntry = {
        id: `TXN-STMT-DISB-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().slice(0, 10),
        type: 'Disbursement',
        description: `Loan facility disbursement via ${channel}`,
        reference: disbRef,
        channel,
        debit: 0,
        credit: loan.totalBorrowed,
        runningBalance: loan.outstandingPrincipal,
        status: 'Completed'
      };
      loan.statement.unshift(statementEntry);
    } else if (isPending) {
      loan.disbursementStatus = 'Pending Settlement';
    } else {
      loan.disbursementStatus = 'Disbursement Failed';
    }

    financialDemoStore.save();

    return {
      success: isSuccess,
      isPending,
      disbursementStatus: disbStatus,
      disbursementReference: disbRef,
      loanId: loan.id,
      loanReference: loan.referenceNumber,
      loanStatus: loan.status,
      disbursedAmount: loan.totalBorrowed,
      providerData: providerResult.data
    };
  }

  // --- FI APPLICATIONS & UNDERWRITING ---

  getFiApplications(fiId) {
    const data = financialDemoStore.getAll();
    if (fiId) {
      return data.loanApplications.filter(a => a.institutionId === fiId);
    }
    return data.loanApplications;
  }

  async underwriteApplication({
    applicationId,
    decision, // 'Approved' | 'Rejected' | 'Under Review'
    feedback,
    configuredAmount,
    configuredRate,
    configuredTerm
  }) {
    if (!applicationId) throw new AppError('Application ID is required.', 400);
    if (!['Approved', 'Rejected', 'Under Review'].includes(decision)) {
      throw new AppError('Invalid decision. Must be Approved, Rejected, or Under Review.', 400);
    }

    const data = financialDemoStore.getAll();
    const appIndex = data.loanApplications.findIndex(a => a.id === applicationId);
    if (appIndex === -1) throw new AppError('Application not found.', 404);

    const app = data.loanApplications[appIndex];
    app.status = decision;
    app.feedback = feedback || (decision === 'Approved' ? 'Application approved by credit underwriting.' : 'Declined.');
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = 'Senior Credit Officer (Elevata Demo)';

    // When an FI approves a demo loan, create a loan record associated with the SME!
    let createdLoan = null;
    if (decision === 'Approved') {
      const principal = configuredAmount ? Number(configuredAmount) : app.requestedAmount;
      const rate = configuredRate ? Number(configuredRate) : app.interestRate;
      const term = configuredTerm ? Number(configuredTerm) : app.termMonths;

      // Approximate monthly amortized installment
      const monthlyRate = (rate / 100) / 12;
      const monthlyInstallment = Math.round((principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term)));

      const loanRef = `LOAN-RW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      createdLoan = {
        id: loanRef,
        applicationId: app.id,
        smeId: app.smeId,
        smeName: app.smeName,
        smeSector: app.smeSector,
        institutionId: app.institutionId,
        institutionName: app.institutionName,
        productName: app.productName,
        referenceNumber: loanRef,
        totalBorrowed: principal,
        originalPrincipal: principal,
        outstandingPrincipal: principal,
        totalRepaymentsMade: 0,
        interestRate: rate,
        termMonths: term,
        repaymentFrequency: 'Monthly',
        monthlyInstallment,
        totalAmountDueNow: 0,
        nextRepaymentDueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        status: 'Approved - Ready for Disbursement',
        disbursedAt: null,
        maturityDate: new Date(Date.now() + term * 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        disbursementChannel: null,
        disbursementReference: null,
        disbursementStatus: 'Pending Disbursement',
        statement: []
      };

      app.associatedLoanId = loanRef;
      app.canDisburse = true;
      data.loans.unshift(createdLoan);
    }

    financialDemoStore.save();

    return {
      application: app,
      createdLoan
    };
  }

  // --- DIGITAL FINANCIAL SERVICES MARKETPLACE ---

  getServices(category) {
    const data = financialDemoStore.getAll();
    if (category && category !== 'All') {
      return data.digitalFinancialServices.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    return data.digitalFinancialServices;
  }

  async publishService(serviceData) {
    if (!serviceData.serviceName || !serviceData.category) {
      throw new AppError('Service name and category are required.', 400);
    }

    const data = financialDemoStore.getAll();
    const newService = {
      id: `dfs-svc-${Date.now().toString().slice(-6)}`,
      institutionId: serviceData.institutionId || 'fi-bk',
      providerName: serviceData.providerName || 'Bank of Kigali (BK Plc)',
      serviceName: serviceData.serviceName,
      category: serviceData.category,
      description: serviceData.description || 'Enterprise financial service.',
      eligibilityCriteria: serviceData.eligibilityCriteria || 'Open to all verified SMEs',
      requirements: serviceData.requirements || ['Elevata Profile Verification'],
      pricing: serviceData.pricing || 'Standard regulated tier',
      availabilityStatus: 'Active',
      endpointUrl: serviceData.endpointUrl || 'https://api.sandbox.bnr.rw/v1/services',
      features: serviceData.features || ['Seamless API Integration', 'Regulatory Sandbox Certified'],
      connectionStatus: 'Not Connected'
    };

    data.digitalFinancialServices.unshift(newService);
    financialDemoStore.save();
    return newService;
  }

  async updateService(serviceId, updates) {
    const data = financialDemoStore.getAll();
    const idx = data.digitalFinancialServices.findIndex(s => s.id === serviceId);
    if (idx === -1) throw new AppError('Service not found.', 404);

    data.digitalFinancialServices[idx] = {
      ...data.digitalFinancialServices[idx],
      ...updates
    };
    financialDemoStore.save();
    return data.digitalFinancialServices[idx];
  }

  // --- SERVICE INTEGRATION & CONNECT FLOW ---

  async connectService({
    serviceId,
    smeId = 'sme-1',
    consentGranted = false,
    payload = {},
    simulateOutcome = 'success'
  }) {
    if (!consentGranted) {
      throw new AppError('Explicit consent is required to connect digital financial services.', 400);
    }

    const data = financialDemoStore.getAll();
    const service = data.digitalFinancialServices.find(s => s.id === serviceId);
    if (!service) throw new AppError('Service not found.', 404);

    const sme = data.demoSmes.find(s => s.id === smeId) || data.demoSmes[0];

    let adapterResult;
    switch (service.category) {
      case 'Mobile Money & Digital Payments':
        adapterResult = await momoAdapter.requestToPay({
          amount: 1000,
          currency: 'RWF',
          phoneNumber: payload.phoneNumber || sme.phone,
          reference: `TEST-CONN-${Date.now().toString().slice(-4)}`,
          provider: service.providerName,
          simulateOutcome,
          relatedSme: `${sme.name} (${sme.id})`,
          relatedReference: service.serviceName
        });
        break;

      case 'Business Savings Accounts':
        adapterResult = await savingsAccountAdapter.openAccount({
          sme,
          initialDeposit: payload.initialDeposit || 50000,
          provider: service.providerName,
          simulateOutcome
        });
        break;

      case 'Merchant Payment Solutions':
        adapterResult = await merchantPaymentAdapter.onboardMerchant({
          sme,
          terminalType: payload.terminalType || 'INTEROPERABLE_RW_QR',
          provider: service.providerName,
          simulateOutcome
        });
        break;

      case 'Business Insurance':
        adapterResult = await insuranceAdapter.requestQuoteAndPolicy({
          sme,
          declaredStockValue: payload.stockValue || 15000000,
          coverageType: payload.coverageType || 'COMPREHENSIVE_FIRE_THEFT',
          provider: service.providerName,
          simulateOutcome
        });
        break;

      default:
        adapterResult = { success: true, statusCode: 200, data: { status: 'CONNECTED' } };
    }

    const isConnected = adapterResult.success;
    const connectionStatus = isConnected ? 'Connected' : 'Failed';

    const connRecord = {
      id: `conn-${Date.now().toString().slice(-6)}`,
      serviceId: service.id,
      serviceName: service.serviceName,
      category: service.category,
      smeId: sme.id,
      smeName: sme.name,
      status: connectionStatus,
      consentGranted: true,
      consentDate: new Date().toISOString(),
      sharedDataSummary: ['Business TIN & Official Name', 'Registered Owner Identity', 'Turnover Metrics Snapshot'],
      applicationReference: `DFS-RW-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      connectedAt: isConnected ? new Date().toISOString() : null,
      integrationDetails: adapterResult.data
    };

    // Update or push connection
    const existingConnIdx = data.serviceConnections.findIndex(c => c.serviceId === service.id && c.smeId === sme.id);
    if (existingConnIdx >= 0) {
      data.serviceConnections[existingConnIdx] = connRecord;
    } else {
      data.serviceConnections.unshift(connRecord);
    }

    // Update service status in catalog
    service.connectionStatus = connectionStatus;

    financialDemoStore.save();

    return {
      success: isConnected,
      serviceId: service.id,
      serviceName: service.serviceName,
      status: connectionStatus,
      connection: connRecord,
      integrationDetails: adapterResult.data
    };
  }

  // --- API INTEGRATION MONITOR LOGS ---

  getApiLogs({ limit = 50, provider, status } = {}) {
    let logs = financialDemoStore.getApiLogs();
    if (provider) {
      logs = logs.filter(l => l.provider.toLowerCase().includes(provider.toLowerCase()));
    }
    if (status) {
      logs = logs.filter(l => l.status.toLowerCase() === status.toLowerCase());
    }
    return logs.slice(0, Number(limit));
  }

  async simulateCategoryHandshake({ category, smeId = 'sme-1', simulateOutcome = 'success' }) {
    const data = financialDemoStore.getAll();
    const sme = data.demoSmes.find(s => s.id === smeId) || data.demoSmes[0];

    let result;
    switch (category) {
      case 'Digital savings accounts':
        result = await savingsAccountAdapter.openAccount({
          sme,
          initialDeposit: 100000,
          provider: 'Bank of Kigali (BK Plc)',
          simulateOutcome
        });
        break;

      case 'Mobile banking':
        result = await mobileBankingAdapter.authenticateConsentAndFetchAccounts({
          sme,
          provider: 'Bank of Kigali (BK Plc)',
          simulateOutcome
        });
        break;

      case 'Merchant payment solutions':
        result = await merchantPaymentAdapter.onboardMerchant({
          sme,
          terminalType: 'INTEROPERABLE_RW_QR',
          provider: 'Equity Bank Rwanda',
          simulateOutcome
        });
        break;

      case 'Digital wallets':
        result = await digitalWalletsAdapter.queryWalletAndKYC({
          sme,
          msisdn: sme.phone || '+250 788 412 890',
          provider: 'MTN Mobile Money Rwanda Ltd',
          simulateOutcome
        });
        break;

      case 'Digital insurance (bancassurance)':
        result = await insuranceAdapter.requestQuoteAndPolicy({
          sme,
          declaredStockValue: 15000000,
          coverageType: 'COMPREHENSIVE_FIRE_THEFT',
          provider: 'Radiant Insurance Company',
          simulateOutcome
        });
        break;

      case 'Digital money transfers':
        result = await digitalMoneyTransfersAdapter.executeTransfer({
          sme,
          amount: 500000,
          beneficiaryBank: 'Bank of Kigali',
          beneficiaryAccount: '40032918451',
          provider: 'BNR National Payment Switch (RIPPS)',
          simulateOutcome
        });
        break;

      default:
        result = { success: true, statusCode: 200, data: { status: 'SIMULATED_OK' } };
    }

    financialDemoStore.save();
    return result;
  }

  // --- DEMO RESET ---

  resetDemo() {
    this.processedIdempotencyKeys.clear();
    const freshData = financialDemoStore.reset();
    return {
      message: 'Elevata Financial Services Regulatory Sandbox Demo environment reset successfully.',
      timestamp: new Date().toISOString(),
      smesCount: freshData.demoSmes.length,
      institutionsCount: freshData.financialInstitutions.length,
      loansCount: freshData.loans.length,
      servicesCount: freshData.digitalFinancialServices.length
    };
  }
}

export const financialDemoService = new FinancialDemoService();
