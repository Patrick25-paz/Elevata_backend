import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const DATA_FILE = path.join(DATA_DIR, 'financial_demo_data.json');

// Helper to ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const getInitialData = () => {
  return {
    financialInstitutions: [
      {
        id: 'fi-bk',
        name: 'Bank of Kigali (BK Plc)',
        shortName: 'BK',
        category: 'Commercial Bank',
        licenseNumber: 'BNR/CB/001/1966',
        rating: 4.9,
        supportedChannels: ['Bank Transfer (RIPPS)', 'Direct Debit', 'BK QuickPay'],
        contactEmail: 'sme-banking@bk.rw',
        contactPhone: '+250 788 143 000',
        logoUrl: '/logos/bk.png'
      },
      {
        id: 'fi-im',
        name: 'I&M Bank Rwanda Plc',
        shortName: 'I&M',
        category: 'Commercial Bank',
        licenseNumber: 'BNR/CB/004/1963',
        rating: 4.8,
        supportedChannels: ['Bank Transfer (RIPPS)', 'I&M OnTheGo Business'],
        contactEmail: 'business@imbank.co.rw',
        contactPhone: '+250 788 162 000',
        logoUrl: '/logos/im.png'
      },
      {
        id: 'fi-equity',
        name: 'Equity Bank Rwanda',
        shortName: 'Equity',
        category: 'Commercial Bank',
        licenseNumber: 'BNR/CB/011/2011',
        rating: 4.7,
        supportedChannels: ['Bank Transfer', 'EazzyBiz Mobile', 'EquiConnect'],
        contactEmail: 'support@equitybank.co.rw',
        contactPhone: '+250 788 190 000',
        logoUrl: '/logos/equity.png'
      },
      {
        id: 'fi-momo',
        name: 'MTN Mobile Money Rwanda Ltd',
        shortName: 'MTN MoMo',
        category: 'Payment Service Provider (PSP)',
        licenseNumber: 'BNR/PSP/002/2021',
        rating: 4.9,
        supportedChannels: ['Mobile Money (MoMoPay)', 'Bulk Disburse Open API', 'USSD Push'],
        contactEmail: 'developer@mtn.co.rw',
        contactPhone: '+250 788 100 100',
        logoUrl: '/logos/momo.png'
      },
      {
        id: 'fi-radiant',
        name: 'Radiant Insurance Company',
        shortName: 'Radiant',
        category: 'Licensed Insurer',
        licenseNumber: 'BNR/INS/008/2013',
        rating: 4.6,
        supportedChannels: ['Digital Policy API', 'MoMo Premium Debit'],
        contactEmail: 'info@radiant.rw',
        contactPhone: '+250 788 300 818',
        logoUrl: '/logos/radiant.png'
      }
    ],

    demoSmes: [
      {
        id: 'sme-1',
        name: 'Kigali Tech Supplies Ltd',
        sector: 'Retail & Electronics',
        tin: '109845231',
        ownerName: 'Patrick Mugabo',
        phone: '+250 788 412 890',
        email: 'info@kigalitech.rw',
        district: 'Gasabo',
        province: 'Kigali City',
        healthScore: 84,
        readinessScore: 88,
        monthlyTurnover: 8500000,
        currentAccountBalance: 3200000
      },
      {
        id: 'sme-2',
        name: 'Inziza Organics Ltd',
        sector: 'Agribusiness & Processing',
        tin: '104728190',
        ownerName: 'Diane Umutoni',
        phone: '+250 788 654 321',
        email: 'diane@inzizaorganics.rw',
        district: 'Musanze',
        province: 'Northern Province',
        healthScore: 76,
        readinessScore: 80,
        monthlyTurnover: 6200000,
        currentAccountBalance: 1850000
      },
      {
        id: 'sme-3',
        name: 'Nyabugogo Hardware & Tools Ltd',
        sector: 'Wholesale & Construction Supplies',
        tin: '101239845',
        ownerName: 'Jean-Claude Habimana',
        phone: '+250 788 901 234',
        email: 'habimana@nyabugogohardware.rw',
        district: 'Nyarugenge',
        province: 'Kigali City',
        healthScore: 91,
        readinessScore: 94,
        monthlyTurnover: 14500000,
        currentAccountBalance: 7800000
      }
    ],

    loanProducts: [
      {
        id: 'prod-wc-01',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        name: 'SME Working Capital Facility',
        category: 'Working Capital',
        minAmount: 1000000,
        maxAmount: 25000000,
        interestRate: 13.5,
        minTermMonths: 6,
        maxTermMonths: 24,
        gracePeriodMonths: 1,
        repaymentFrequency: 'Monthly',
        description: 'Flexible revolving credit line to finance inventory purchases and short-term working capital needs.',
        requirements: ['Minimum 6 months active Elevata digital sales records', 'RRA Tax clearance certificate', 'Valid commercial registry']
      },
      {
        id: 'prod-eq-02',
        institutionId: 'fi-im',
        institutionName: 'I&M Bank Rwanda Plc',
        name: 'SME Equipment & Asset Financing',
        category: 'Asset Finance',
        minAmount: 3000000,
        maxAmount: 50000000,
        interestRate: 12.5,
        minTermMonths: 12,
        maxTermMonths: 36,
        gracePeriodMonths: 2,
        repaymentFrequency: 'Monthly',
        description: 'Medium-term facility designed to acquire machinery, commercial vehicles, and productivity technology.',
        requirements: ['Equipment pro-forma invoice', 'Business financial health score >= 75%', 'Clean credit bureau (CRB) standing']
      },
      {
        id: 'prod-inv-03',
        institutionId: 'fi-equity',
        institutionName: 'Equity Bank Rwanda',
        name: 'Digital Purchase Order & Invoice Discounting',
        category: 'Invoice Discounting',
        minAmount: 500000,
        maxAmount: 15000000,
        interestRate: 11.0,
        minTermMonths: 1,
        maxTermMonths: 6,
        gracePeriodMonths: 0,
        repaymentFrequency: 'Bullet / Monthly',
        description: 'Instant liquidity against verified supply contracts and confirmed corporate buyer invoices.',
        requirements: ['Verified customer purchase order', 'Elevata supplier ledger verification']
      }
    ],

    loanApplications: [
      {
        id: 'APP-DEMO-001',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        smeSector: 'Retail & Electronics',
        productId: 'prod-wc-01',
        productName: 'SME Working Capital Facility',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        requestedAmount: 12000000,
        termMonths: 12,
        interestRate: 13.5,
        purpose: 'Bulk stocking of consumer IT accessories ahead of peak festive trade quarter.',
        status: 'Approved',
        smeHealthScore: 84,
        smeReadinessScore: 88,
        contactPhone: '+250 788 412 890',
        contactEmail: 'info@kigalitech.rw',
        notes: 'Requested expedited underwriting with monthly amortized installments.',
        feedback: 'Approved by Credit Risk Committee based on consistent POS turnover and healthy DSCR (1.42x).',
        appliedAt: '2026-09-15T09:30:00.000Z',
        reviewedAt: '2026-09-17T14:15:00.000Z',
        reviewedBy: 'Senior Credit Underwriter (BK)',
        canDisburse: true,
        associatedLoanId: 'LOAN-RW-2026-0842'
      },
      {
        id: 'APP-DEMO-002',
        smeId: 'sme-2',
        smeName: 'Inziza Organics Ltd',
        smeSector: 'Agribusiness & Processing',
        productId: 'prod-eq-02',
        productName: 'SME Equipment & Asset Financing',
        institutionId: 'fi-im',
        institutionName: 'I&M Bank Rwanda Plc',
        requestedAmount: 7500000,
        termMonths: 24,
        interestRate: 12.5,
        purpose: 'Procurement of cold-chain solar storage unit and commercial fruit pulper.',
        status: 'Under Review',
        smeHealthScore: 76,
        smeReadinessScore: 80,
        contactPhone: '+250 788 654 321',
        contactEmail: 'diane@inzizaorganics.rw',
        notes: 'Pro-forma equipment quote attached from verified East African machinery dealer.',
        feedback: 'Under review by Agri-Desk. Awaiting machinery warranty certification.',
        appliedAt: '2026-10-02T11:00:00.000Z',
        reviewedAt: null,
        reviewedBy: null,
        canDisburse: false,
        associatedLoanId: null
      },
      {
        id: 'APP-DEMO-003',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        smeSector: 'Retail & Electronics',
        productId: 'prod-inv-03',
        productName: 'Digital Purchase Order & Invoice Discounting',
        institutionId: 'fi-equity',
        institutionName: 'Equity Bank Rwanda',
        requestedAmount: 4000000,
        termMonths: 3,
        interestRate: 11.0,
        purpose: 'Short-term funding to fulfil corporate supplier contract for Ministry of ICT event.',
        status: 'Approved',
        smeHealthScore: 84,
        smeReadinessScore: 88,
        contactPhone: '+250 788 412 890',
        contactEmail: 'info@kigalitech.rw',
        notes: 'Client invoice due within 60 days.',
        feedback: 'Approved under fast-track PO credit policy. Ready for demo disbursement.',
        appliedAt: '2026-10-08T15:20:00.000Z',
        reviewedAt: '2026-10-09T10:00:00.000Z',
        reviewedBy: 'Corporate SME Credit Analyst',
        canDisburse: true,
        associatedLoanId: 'LOAN-RW-2026-0915'
      }
    ],

    loans: [
      {
        id: 'LOAN-RW-2026-0842',
        applicationId: 'APP-DEMO-001',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        smeSector: 'Retail & Electronics',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        productName: 'SME Working Capital Facility',
        referenceNumber: 'LOAN-RW-2026-0842',
        totalBorrowed: 10000000,
        originalPrincipal: 10000000,
        outstandingPrincipal: 6500000,
        totalRepaymentsMade: 3842500,
        interestRate: 13.5,
        termMonths: 12,
        repaymentFrequency: 'Monthly',
        monthlyInstallment: 895000,
        totalAmountDueNow: 895000,
        nextRepaymentDueDate: '2026-11-05',
        status: 'Active',
        disbursedAt: '2026-06-01T10:00:00.000Z',
        maturityDate: '2027-05-31',
        disbursementChannel: 'Bank Transfer (RIPPS)',
        disbursementReference: 'DISB-BK-2026-00192',
        disbursementStatus: 'Completed',
        statement: [
          {
            id: 'TXN-STMT-001',
            date: '2026-06-01',
            type: 'Disbursement',
            description: 'Loan facility disbursement to BNR RIPPS clearing account',
            reference: 'DISB-BK-2026-00192',
            channel: 'Bank Transfer (RIPPS)',
            debit: 0,
            credit: 10000000,
            runningBalance: 10000000,
            status: 'Completed'
          },
          {
            id: 'TXN-STMT-002',
            date: '2026-07-05',
            type: 'Repayment',
            description: 'Installment #1 repayment via Bank of Kigali Direct Debit',
            reference: 'REP-BK-2026-4401',
            channel: 'Bank Transfer',
            debit: 1280833,
            credit: 0,
            runningBalance: 8850000,
            status: 'Completed'
          },
          {
            id: 'TXN-STMT-003',
            date: '2026-08-05',
            type: 'Repayment',
            description: 'Installment #2 repayment via MTN MoMoPay (*182#)',
            reference: 'REP-MOMO-2026-8912',
            channel: 'Mobile Money',
            debit: 1280833,
            credit: 0,
            runningBalance: 7680000,
            status: 'Completed'
          },
          {
            id: 'TXN-STMT-004',
            date: '2026-09-05',
            type: 'Repayment',
            description: 'Installment #3 repayment via Airtel Money Express',
            reference: 'REP-AIRTEL-2026-1104',
            channel: 'Mobile Money',
            debit: 1280834,
            credit: 0,
            runningBalance: 6500000,
            status: 'Completed'
          }
        ]
      },
      {
        id: 'LOAN-RW-2026-0915',
        applicationId: 'APP-DEMO-003',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        smeSector: 'Retail & Electronics',
        institutionId: 'fi-equity',
        institutionName: 'Equity Bank Rwanda',
        productName: 'Digital Purchase Order & Invoice Discounting',
        referenceNumber: 'LOAN-RW-2026-0915',
        totalBorrowed: 4000000,
        originalPrincipal: 4000000,
        outstandingPrincipal: 4000000,
        totalRepaymentsMade: 0,
        interestRate: 11.0,
        termMonths: 3,
        repaymentFrequency: 'Monthly',
        monthlyInstallment: 1357000,
        totalAmountDueNow: 0,
        nextRepaymentDueDate: '2026-11-20',
        status: 'Approved - Ready for Disbursement',
        disbursedAt: null,
        maturityDate: '2027-01-20',
        disbursementChannel: null,
        disbursementReference: null,
        disbursementStatus: 'Pending Disbursement',
        statement: []
      }
    ],

    repayments: [
      {
        id: 'TXN-REP-001',
        loanId: 'LOAN-RW-2026-0842',
        loanReference: 'LOAN-RW-2026-0842',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        amount: 1280833,
        channel: 'Bank Transfer',
        paymentDetails: {
          accountNumber: '40032918451',
          bankName: 'Bank of Kigali'
        },
        reference: 'REP-BK-2026-4401',
        status: 'Completed',
        timestamp: '2026-07-05T14:22:10.000Z'
      },
      {
        id: 'TXN-REP-002',
        loanId: 'LOAN-RW-2026-0842',
        loanReference: 'LOAN-RW-2026-0842',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        amount: 1280833,
        channel: 'Mobile Money',
        paymentDetails: {
          provider: 'MTN Mobile Money Rwanda',
          phoneNumber: '+250 788 412 890'
        },
        reference: 'REP-MOMO-2026-8912',
        status: 'Completed',
        timestamp: '2026-08-05T09:12:44.000Z'
      },
      {
        id: 'TXN-REP-003',
        loanId: 'LOAN-RW-2026-0842',
        loanReference: 'LOAN-RW-2026-0842',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        institutionId: 'fi-bk',
        institutionName: 'Bank of Kigali (BK Plc)',
        amount: 1280834,
        channel: 'Mobile Money',
        paymentDetails: {
          provider: 'Airtel Money Rwanda',
          phoneNumber: '+250 733 412 890'
        },
        reference: 'REP-AIRTEL-2026-1104',
        status: 'Completed',
        timestamp: '2026-09-05T16:04:19.000Z'
      }
    ],

    digitalFinancialServices: [
      {
        id: 'dfs-momo-01',
        institutionId: 'fi-momo',
        providerName: 'MTN Mobile Money Rwanda Ltd',
        serviceName: 'MTN MoMo Business Collections & Open API',
        category: 'Mobile Money & Digital Payments',
        description: 'Instant customer payments collection via MoMoPay merchant codes, USSD push prompts, and automated bulk B2B disbursements.',
        eligibilityCriteria: 'Registered Rwandan SME with active trading history and valid TIN.',
        requirements: ['RDB Certificate of Registration', 'TIN Certificate', 'Elevata Business Profile'],
        pricing: '0.5% capped transaction fee on collections, zero setup fee.',
        availabilityStatus: 'Active',
        endpointUrl: 'https://api.sandbox.mtn.co.rw/v1/momo/collections',
        features: ['Instant QR Code generation', 'Instant USSD Push prompt to customer', 'Real-time Webhook transaction notifications', 'Automated nightly bank account settlement'],
        connectionStatus: 'Not Connected'
      },
      {
        id: 'dfs-savings-02',
        institutionId: 'fi-bk',
        providerName: 'Bank of Kigali (BK Plc)',
        serviceName: 'BK High-Yield SME Escrow & Reserve Account',
        category: 'Business Savings Accounts',
        description: 'Interest-bearing reserve account for SME operating cash surplus, offering tiered yield up to 8.5% p.a. with same-day liquidity access.',
        eligibilityCriteria: 'Elevata verified SME with minimum average monthly revenue of RWF 2,000,000.',
        requirements: ['Digital KYC Identity confirmation', 'Authorized signatory mandate', 'Initial deposit: RWF 50,000'],
        pricing: 'Free account maintenance; competitive tiered interest credited monthly.',
        availabilityStatus: 'Active',
        endpointUrl: 'https://api.sandbox.bk.rw/v2/savings/business-reserve',
        features: ['Automated daily cash sweep rule', 'Yield calculation up to 8.5% p.a.', 'BNR Deposit Protection Guarantee eligible', 'Direct integration with Elevata financial statements'],
        connectionStatus: 'Not Connected'
      },
      {
        id: 'dfs-merchant-03',
        institutionId: 'fi-equity',
        providerName: 'Equity Bank Rwanda',
        serviceName: 'Equity EazzyPay Integrated Merchant Solution',
        category: 'Merchant Payment Solutions',
        description: 'Unified interoperable QR and POS acceptance enabling payments from all Rwandan bank debit cards, MTN MoMo, and Airtel Money.',
        eligibilityCriteria: 'Physical or digital merchant operating within Rwanda with verifiable transaction receipts.',
        requirements: ['Store location verification', 'National ID of business owner', 'Bank settlement account'],
        pricing: '0.8% merchant discount rate (MDR) on card, 0.4% on mobile wallets.',
        availabilityStatus: 'Active',
        endpointUrl: 'https://api.sandbox.equitybank.co.rw/v1/merchants/onboarding',
        features: ['Interoperable Rwanda QR standard support', 'Real-time sales reconciliation ledger', 'Instant checkout link generator', 'Digital receipt SMS dispatch'],
        connectionStatus: 'Not Connected'
      },
      {
        id: 'dfs-insure-04',
        institutionId: 'fi-radiant',
        providerName: 'Radiant Insurance Company',
        serviceName: 'Radiant Comprehensive Commercial Stock & Fire Cover',
        category: 'Business Insurance',
        description: 'Micro-insurance protection tailored for retail and wholesale SME inventory against fire, burglary, flash flood, and transit hazards.',
        eligibilityCriteria: 'SMEs maintaining recorded stock value on Elevata inventory ledger.',
        requirements: ['Elevata inventory stock ledger audit snapshot', 'Physical premise safety verification'],
        pricing: 'From RWF 18,500 monthly depending on declared stock volume.',
        availabilityStatus: 'Active',
        endpointUrl: 'https://api.sandbox.radiant.rw/v1/micro-insurance/quotes',
        features: ['Fast-track 48-hour claim processing', 'Direct premium deduction from daily sales', 'Dynamic coverage limit scaling with inventory', 'Flood and power surge coverage included'],
        connectionStatus: 'Not Connected'
      }
    ],

    serviceConnections: [
      {
        id: 'conn-init-01',
        serviceId: 'dfs-momo-01',
        serviceName: 'MTN MoMo Business Collections & Open API',
        smeId: 'sme-1',
        smeName: 'Kigali Tech Supplies Ltd',
        status: 'Connected',
        consentGranted: true,
        consentDate: '2026-08-10T11:20:00.000Z',
        sharedDataSummary: ['Business TIN & Name', 'Owner Phone Number', 'Elevata POS Terminal ID'],
        applicationReference: 'MOMO-RW-MERCH-8120',
        connectedAt: '2026-08-10T11:22:15.000Z',
        integrationDetails: {
          merchantId: 'MOMO-77291',
          merchantCode: '901234',
          qrCodeString: 'MOMOPAY://RW/901234/KIGALITECH',
          apiEnvironment: 'BNR-SANDBOX-TEST',
          currency: 'RWF'
        }
      }
    ],

    apiLogs: [
      {
        id: 'LOG-SANDBOX-001',
        requestId: 'REQ-MOMO-2026-8912',
        timestamp: '2026-08-05T09:12:44.000Z',
        provider: 'MTN Mobile Money Rwanda Ltd',
        service: 'MoMoPay Collection API',
        operation: 'processRepaymentCollection',
        method: 'POST',
        endpoint: 'https://api.sandbox.mtn.co.rw/v1/momo/collections/request-to-pay',
        durationMs: 342,
        statusCode: 200,
        status: 'Success',
        relatedSme: 'Kigali Tech Supplies Ltd (sme-1)',
        relatedReference: 'LOAN-RW-2026-0842',
        requestPayload: {
          amount: 1280833,
          currency: 'RWF',
          externalId: 'REP-MOMO-2026-8912',
          payer: {
            partyIdType: 'MSISDN',
            partyId: '+250788412890'
          },
          payerMessage: 'Elevata Loan Repayment - Installment #2',
          payeeNote: 'Loan LOAN-RW-2026-0842'
        },
        responsePayload: {
          status: 'SUCCESSFUL',
          financialTransactionId: 'MTN-RW-TXN-994821',
          transactionReference: 'REP-MOMO-2026-8912',
          message: 'USSD prompt authorized by customer PIN',
          timestamp: '2026-08-05T09:12:44.342Z'
        }
      },
      {
        id: 'LOG-SANDBOX-002',
        requestId: 'REQ-BK-DISB-2026-00192',
        timestamp: '2026-06-01T10:00:00.000Z',
        provider: 'Bank of Kigali (BK Plc)',
        service: 'Core Banking Disbursement Gateway',
        operation: 'executeLoanDisbursement',
        method: 'POST',
        endpoint: 'https://api.sandbox.bk.rw/v2/credit/facilities/disburse',
        durationMs: 418,
        statusCode: 200,
        status: 'Success',
        relatedSme: 'Kigali Tech Supplies Ltd (sme-1)',
        relatedReference: 'LOAN-RW-2026-0842',
        requestPayload: {
          facilityReference: 'LOAN-RW-2026-0842',
          principalAmount: 10000000,
          currency: 'RWF',
          clearingSystem: 'BNR-RIPPS',
          beneficiary: {
            businessName: 'Kigali Tech Supplies Ltd',
            tin: '109845231',
            accountNumber: '40032918451'
          }
        },
        responsePayload: {
          disbursementStatus: 'CONFIRMED',
          clearingRef: 'RIPPS-BK-2026-00192',
          bookedAt: '2026-06-01T10:00:00.418Z',
          disbursedAmount: 10000000
        }
      }
    ]
  };
};

class FinancialDemoStore {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.reset();
      }
    } catch (e) {
      console.warn('Error reading financial demo store, re-initializing seed:', e.message);
      this.reset();
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write financial demo data to disk:', e);
    }
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  getAll() {
    if (!this.data) this.init();
    return this.data;
  }

  // FI Methods
  getFinancialInstitutions() {
    return this.getAll().financialInstitutions;
  }

  getDemoSmes() {
    return this.getAll().demoSmes;
  }

  getLoanProducts() {
    return this.getAll().loanProducts;
  }

  getApplications() {
    return this.getAll().loanApplications;
  }

  getLoans() {
    return this.getAll().loans;
  }

  getRepayments() {
    return this.getAll().repayments;
  }

  getDigitalServices() {
    return this.getAll().digitalFinancialServices;
  }

  getServiceConnections() {
    return this.getAll().serviceConnections;
  }

  getApiLogs() {
    return this.getAll().apiLogs;
  }

  addApiLog(log) {
    const data = this.getAll();
    const newLog = {
      id: `LOG-SANDBOX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    data.apiLogs.unshift(newLog);
    // Keep max 100 logs
    if (data.apiLogs.length > 100) {
      data.apiLogs = data.apiLogs.slice(0, 100);
    }
    this.save();
    return newLog;
  }
}

export const financialDemoStore = new FinancialDemoStore();
