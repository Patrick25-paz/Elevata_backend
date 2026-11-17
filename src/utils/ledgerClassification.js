/**
 * Ledger classification rules (server side).
 * Keep in sync with frontend/src/lib/ledgerClassification.ts.
 *
 * pnl:      revenue | other_income | cogs | opex | none
 * cashFlow: operating | investing | financing
 */

const CASH_IN = {
  'loan received': { pnl: 'none', cashFlow: 'financing' },
  'owner capital injection': { pnl: 'none', cashFlow: 'financing' },
  'grant received': { pnl: 'other_income', cashFlow: 'operating' },
  'customer advance': { pnl: 'none', cashFlow: 'operating' },
  'receivable collected': { pnl: 'none', cashFlow: 'operating' },
  'asset disposal': { pnl: 'none', cashFlow: 'investing' },
  'other inflow': { pnl: 'other_income', cashFlow: 'operating' }
};

const CASH_OUT = {
  'loan repayment': { pnl: 'none', cashFlow: 'financing' },
  'supplier settlement': { pnl: 'none', cashFlow: 'operating' },
  'owner drawing': { pnl: 'none', cashFlow: 'financing' },
  'asset purchase': { pnl: 'none', cashFlow: 'investing' }
};

const key = (value) => String(value || '').trim().toLowerCase();

export const classifyCashIn = (category) => CASH_IN[key(category)] || { pnl: 'other_income', cashFlow: 'operating' };
export const classifyCashOut = (category) => CASH_OUT[key(category)] || { pnl: 'opex', cashFlow: 'operating' };

export const isCreditPayment = (method) => key(method).startsWith('credit');

/** True when money actually changed hands for a sale or purchase. */
export const isSettled = (status, paymentMethod) => {
  const s = key(status || 'Completed');
  if (s === 'cancelled' || s === 'pending' || s === 'partial') return false;
  return !isCreditPayment(paymentMethod);
};

/** Stock intakes keep the payment method inside notes ("Payment: X") until it gets its own column. */
export const intakePaymentMethod = (intake) => {
  const match = /Payment:\s*([^|]+)/.exec(intake?.notes || '');
  return match ? match[1].trim() : 'Cash';
};
