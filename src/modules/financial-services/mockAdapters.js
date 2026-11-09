import { financialDemoStore } from './financialDemo.store.js';

/**
 * Helper to simulate realistic network delay
 */
const delay = (ms = 350) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 1. Mobile Money & Digital Payments Adapter (MTN MoMo & Airtel Money)
 */
export const momoAdapter = {
  async requestToPay({ amount, currency = 'RWF', phoneNumber, reference, provider = 'MTN Mobile Money Rwanda', simulateOutcome = 'success', relatedSme, relatedReference }) {
    const startTime = Date.now();
    await delay(300);

    const endpoint = provider.toLowerCase().includes('airtel')
      ? 'https://api.sandbox.airtel.rw/v1/payments/collection'
      : 'https://api.sandbox.mtn.co.rw/v1/momo/collections/request-to-pay';

    const reqPayload = {
      amount,
      currency,
      externalId: reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: phoneNumber
      },
      payerMessage: 'Elevata Loan Repayment',
      payeeNote: `Ref: ${reference}`
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 402;
      status = 'Failed';
      resPayload = {
        status: 'FAILED',
        errorCode: 'INSUFFICIENT_FUNDS_OR_DECLINED',
        message: 'Subscriber phone balance insufficient or USSD authorization timed out.',
        timestamp: new Date().toISOString()
      };
    } else if (simulateOutcome === 'pending') {
      statusCode = 202;
      status = 'Pending';
      resPayload = {
        status: 'PENDING',
        transactionStatus: 'AWAITING_CUSTOMER_PIN_PROMPT',
        message: 'USSD prompt dispatched to mobile handset. Waiting for subscriber confirmation.',
        timestamp: new Date().toISOString()
      };
    } else {
      statusCode = 200;
      status = 'Success';
      resPayload = {
        status: 'SUCCESSFUL',
        financialTransactionId: `MOMO-RW-${Math.floor(100000 + Math.random() * 900000)}`,
        transactionReference: reference,
        amountDebited: amount,
        currency,
        message: 'USSD prompt confirmed by customer PIN. Wallet debited successfully.',
        timestamp: new Date().toISOString()
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId: `REQ-${reference}`,
      provider,
      service: 'Mobile Money Collection API',
      operation: 'requestToPay',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: relatedSme || 'Demo SME',
      relatedReference: relatedReference || reference,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome === 'success',
      isPending: simulateOutcome === 'pending',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 2. Bank Transfer & Core Banking Disbursement Adapter (BNR RIPPS / RTGS)
 */
export const bankTransferAdapter = {
  async processTransfer({ amount, currency = 'RWF', sourceAccount, destinationAccount, bankName, reference, isDisbursement = false, simulateOutcome = 'success', relatedSme, relatedReference }) {
    const startTime = Date.now();
    await delay(400);

    const endpoint = isDisbursement
      ? `https://api.sandbox.${bankName.toLowerCase().replace(/[^a-z]/g, '') || 'bk'}.rw/v2/credit/facilities/disburse`
      : 'https://api.sandbox.bnr.rw/v1/ripps/direct-credit';

    const reqPayload = {
      clearingSystem: 'BNR-RIPPS-NATIONAL',
      instructionReference: reference,
      amount,
      currency,
      debitAccount: sourceAccount,
      creditAccount: destinationAccount,
      settlementType: 'REAL_TIME_GROSS_SETTLEMENT'
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 502;
      status = 'Failed';
      resPayload = {
        status: 'FAILED',
        clearingCode: 'RIPPS_REJECTED',
        reason: 'Beneficiary account verification failed or destination core banking node rejected payment.',
        timestamp: new Date().toISOString()
      };
    } else if (simulateOutcome === 'pending') {
      statusCode = 202;
      status = 'Pending';
      resPayload = {
        status: 'QUEUED_FOR_SETTLEMENT',
        clearingBatch: `RIPPS-BATCH-${Date.now().toString().slice(-4)}`,
        message: 'Payment received by interbank clearing switch. Awaiting settlement confirmation window.',
        timestamp: new Date().toISOString()
      };
    } else {
      statusCode = 200;
      status = 'Success';
      resPayload = {
        status: 'SETTLED',
        clearingReference: `RIPPS-RW-${Math.floor(100000 + Math.random() * 900000)}`,
        transactionReference: reference,
        clearingTimestamp: new Date().toISOString(),
        settledAmount: amount,
        message: 'Fund transfer cleared through BNR National Payment System.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId: `REQ-${reference}`,
      provider: bankName || 'National Payment Switch',
      service: isDisbursement ? 'Core Banking Disbursement Gateway' : 'BNR Interbank Settlement (RIPPS)',
      operation: isDisbursement ? 'executeLoanDisbursement' : 'processBankTransfer',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: relatedSme || 'Demo SME',
      relatedReference: relatedReference || reference,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome === 'success',
      isPending: simulateOutcome === 'pending',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 3. Business Savings Account Adapter
 */
export const savingsAccountAdapter = {
  async openAccount({ sme, initialDeposit = 50000, provider = 'Bank of Kigali (BK Plc)', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(350);

    const requestId = `REQ-SAV-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.bk.rw/v2/savings/business-reserve/onboard';

    const reqPayload = {
      businessName: sme.name,
      tin: sme.tin,
      ownerName: sme.ownerName,
      contactPhone: sme.phone,
      initialDepositRwf: initialDeposit,
      savingsProductTier: 'ELEVATA_PREMIER_RESERVE',
      kycVerifiedByPlatform: true
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 400;
      status = 'Failed';
      resPayload = {
        error: 'KYC_SANCTIONS_CHECK_FAILED',
        message: 'Business KYC profile verification flagged discrepancy in TIN records.',
        timestamp: new Date().toISOString()
      };
    } else {
      const generatedIban = `RW45BKIG${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const generatedAcc = `400${Math.floor(10000000 + Math.random() * 90000000)}`;
      resPayload = {
        accountStatus: 'ACTIVE',
        accountNumber: generatedAcc,
        iban: generatedIban,
        currency: 'RWF',
        annualYieldRate: 8.5,
        depositProtectionInsured: true,
        availableBalance: initialDeposit,
        openedAt: new Date().toISOString(),
        message: 'Business high-yield reserve account generated and connected to Elevata ledger.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId,
      provider,
      service: 'Business Savings Reserve API',
      operation: 'openBusinessSavingsAccount',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: resPayload.accountNumber || requestId,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 4. Merchant Payment Solutions Adapter
 */
export const merchantPaymentAdapter = {
  async onboardMerchant({ sme, terminalType = 'INTEROPERABLE_RW_QR', provider = 'Equity Bank Rwanda', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(350);

    const requestId = `REQ-MERCH-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.equitybank.co.rw/v1/merchants/onboarding';

    const reqPayload = {
      tradingName: sme.name,
      tin: sme.tin,
      physicalDistrict: sme.district,
      paymentAcceptanceChannels: ['VISA', 'MASTERCARD', 'MOMO_PAY', 'AIRTEL_MONEY'],
      settlementAccount: '40032918451',
      dailyExpectedVolume: sme.monthlyTurnover ? Math.round(sme.monthlyTurnover / 25) : 300000
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 422;
      status = 'Failed';
      resPayload = {
        error: 'RISK_SCORING_UNAVAILABLE',
        message: 'Automated AML risk screening rejected merchant terminal assignment.',
        timestamp: new Date().toISOString()
      };
    } else {
      const merchantCode = `${Math.floor(100000 + Math.random() * 900000)}`;
      resPayload = {
        merchantId: `EQ-MERCH-${merchantCode}`,
        merchantCode,
        status: 'ONBOARDED_ACTIVE',
        assignedQrFormat: 'EMV_CO_RWANDA_STANDARD',
        qrPayload: `RW.GOV.BNR://EAZZYPAY/${merchantCode}?NAME=${encodeURIComponent(sme.name)}&CUR=RWF`,
        settlementFrequency: 'REAL_TIME_T_PLUS_0',
        cardProcessingRatePercent: 0.8,
        mobileWalletProcessingRatePercent: 0.4,
        message: 'Merchant payment gateway provisioned. Instant QR and checkout link ready.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId,
      provider,
      service: 'Merchant Payment Gateway Onboarding API',
      operation: 'onboardMerchantTerminal',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: resPayload.merchantId || requestId,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 5. Business Insurance Adapter
 */
export const insuranceAdapter = {
  async requestQuoteAndPolicy({ sme, declaredStockValue = 15000000, coverageType = 'COMPREHENSIVE_FIRE_THEFT', provider = 'Radiant Insurance Company', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(350);

    const requestId = `REQ-INS-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.radiant.rw/v1/micro-insurance/quotes';

    const reqPayload = {
      insuredParty: sme.name,
      tin: sme.tin,
      riskLocation: `${sme.district}, ${sme.province}`,
      declaredStockValue,
      coverageType,
      verifiedLedgerSource: 'ELEVATA_360_INVENTORY'
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 400;
      status = 'Failed';
      resPayload = {
        error: 'UNDERWRITING_THRESHOLD_EXCEEDED',
        message: 'Risk location in high-flood zone without secondary drainage verification.',
        timestamp: new Date().toISOString()
      };
    } else {
      const policyNumber = `RAD-POL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const annualPremium = Math.round(declaredStockValue * 0.015);
      const monthlyInstallment = Math.round(annualPremium / 12);

      resPayload = {
        quoteStatus: 'POLICY_ISSUED',
        policyNumber,
        coverageType: 'Commercial Stock, Fire & Burglary Standard Policy',
        insuredSumLimit: declaredStockValue,
        annualPremiumRwf: annualPremium,
        monthlyDeductionRwf: monthlyInstallment,
        deductiblePercent: 5.0,
        effectiveDate: new Date().toISOString().slice(0, 10),
        expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        message: 'Policy binder issued and linked to Elevata inventory monitoring system.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId,
      provider,
      service: 'Micro-Insurance Underwriting API',
      operation: 'generateQuoteAndIssuePolicy',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: resPayload.policyNumber || requestId,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 6. Mobile Banking & Open Banking Adapter
 */
export const mobileBankingAdapter = {
  async authenticateConsentAndFetchAccounts({ sme, provider = 'Bank of Kigali (BK Plc)', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(320);

    const requestId = `REQ-OB-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.bk.rw/v1/open-banking/accounts';

    const reqPayload = {
      consentId: `BNR-CONSENT-${Math.floor(100000 + Math.random() * 900000)}`,
      smeTin: sme.tin,
      requestedScope: ['ACCOUNTS_READ', 'BALANCES_READ', 'TRANSACTIONS_READ_90D'],
      clientSignature: 'SHA256withRSA:ELEVATA_REGULATED_SANDBOX_KEY',
      authMethod: 'CUSTOMER_BIOMETRIC_PUSH'
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 403;
      status = 'Failed';
      resPayload = {
        error: 'CONSENT_EXPIRED_OR_REVOKED',
        message: 'Customer revoked Open Banking data sharing authorization or session timed out.',
        timestamp: new Date().toISOString()
      };
    } else {
      resPayload = {
        status: 'AUTHORIZED',
        accounts: [
          {
            accountNumber: '40032918451',
            accountType: 'Corporate Current Account (RWF)',
            currency: 'RWF',
            availableBalance: sme.currentAccountBalance || 3200000,
            status: 'ACTIVE'
          },
          {
            accountNumber: '40032918452',
            accountType: 'Operating Reserve Vault',
            currency: 'RWF',
            availableBalance: 850000,
            status: 'ACTIVE'
          }
        ],
        lastSyncedAt: new Date().toISOString(),
        message: 'Account balance and telemetry fetched successfully under authorized consent.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId,
      provider,
      service: 'Open Banking Account Information API',
      operation: 'getAccountsWithConsent',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: reqPayload.consentId,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 7. Digital Wallets Adapter
 */
export const digitalWalletsAdapter = {
  async queryWalletAndKYC({ sme, msisdn = '+250 788 412 890', provider = 'MTN Mobile Money Rwanda Ltd', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(280);

    const requestId = `REQ-WLT-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.mtn.co.rw/v1/wallets/kyc-query';

    const reqPayload = {
      msisdn,
      smeTin: sme.tin,
      inquiryType: 'FULL_WALLET_METRICS',
      requestedBy: 'ELEVATA_SME_GATEWAY'
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 404;
      status = 'Failed';
      resPayload = {
        error: 'WALLET_NOT_FOUND_OR_RESTRICTED',
        message: 'Mobile subscriber wallet not found or KYC status Tier 1 unverified.',
        timestamp: new Date().toISOString()
      };
    } else {
      resPayload = {
        status: 'WALLET_ACTIVE',
        msisdn,
        kycTier: 'TIER_3_REGISTERED_COMMERCIAL_ENTITY',
        dailyTransactionLimitRwf: 10000000,
        monthlyTurnoverAllowedRwf: 50000000,
        linkedMerchantTill: `MOMO-TILL-${Math.floor(100000 + Math.random() * 900000)}`,
        verificationBadge: 'BNR_COMPLIANT_MERCHANT',
        message: 'Digital wallet validated. Registered for commercial receivables.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId,
      provider,
      service: 'Digital Wallet Information & KYC API',
      operation: 'queryWalletKycMetrics',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: msisdn,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

/**
 * 8. Digital Money Transfers (RIPPS / Interbank / PSP Switch)
 */
export const digitalMoneyTransfersAdapter = {
  async executeTransfer({ sme, amount = 250000, beneficiaryBank = 'Bank of Kigali', beneficiaryAccount = '40032918451', provider = 'BNR National Payment Switch (RIPPS)', simulateOutcome = 'success' }) {
    const startTime = Date.now();
    await delay(450);

    const txRef = `RIPPS-TX-${Date.now().toString().slice(-6)}`;
    const endpoint = 'https://api.sandbox.bnr.rw/v2/ripps/instant-interbank-transfer';

    const reqPayload = {
      instructionIdentification: txRef,
      clearingSystem: 'RIPPS_INSTANT_PAYMENT',
      debtorAgent: 'EQBLRW22 (Equity Bank Rwanda)',
      debtorAccount: '10049281921',
      debtorName: sme.name,
      creditorAgent: 'BOKIRWRW (Bank of Kigali)',
      creditorAccount: beneficiaryAccount,
      amount,
      currency: 'RWF',
      regulatoryPurposeCode: 'COMMERCIAL_SUPPLIER_PAYMENT'
    };

    let statusCode = 200;
    let status = 'Success';
    let resPayload = {};

    if (simulateOutcome === 'failure') {
      statusCode = 502;
      status = 'Failed';
      resPayload = {
        error: 'CLEARING_SWITCH_REJECTED',
        reasonCode: 'SETTLEMENT_LIMIT_EXCEEDED_OR_BENEFICIARY_BLOCKED',
        message: 'Transfer declined by national clearing switch rules engine.',
        timestamp: new Date().toISOString()
      };
    } else {
      resPayload = {
        status: 'CLEARED_AND_SETTLED',
        settlementReference: txRef,
        clearingTimestamp: new Date().toISOString(),
        settlementCycle: 'REAL_TIME_GROSS',
        feeChargedRwf: 200,
        confirmationToken: `BNR-PROOF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        message: 'Funds transferred and settled between financial institutions via BNR RIPPS gateway.'
      };
    }

    const durationMs = Date.now() - startTime;
    financialDemoStore.addApiLog({
      requestId: `REQ-${txRef}`,
      provider,
      service: 'BNR RIPPS Interbank Instant Transfer API',
      operation: 'executeInterbankInstantTransfer',
      method: 'POST',
      endpoint,
      durationMs,
      statusCode,
      status,
      relatedSme: `${sme.name} (${sme.id})`,
      relatedReference: txRef,
      requestPayload: reqPayload,
      responsePayload: resPayload
    });

    return {
      success: simulateOutcome !== 'failure',
      statusCode,
      data: resPayload
    };
  }
};

