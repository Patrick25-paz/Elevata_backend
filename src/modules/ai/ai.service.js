import { AppError } from '../../utils/errors.js';
import businessService from '../business/business.service.js';

class AIService {
  generateCoreResponse(user, message, context = {}) {
    const values = [...message.matchAll(/(?:RWF\s*)?(\d[\d,]*(?:\.\d+)?)/gi)]
      .map((match) => Number(match[1].replace(/,/g, '')))
      .filter(Number.isFinite);
    const lowerMessage = message.toLowerCase();
    const format = (value) => `${Math.round(value).toLocaleString('en-US')} RWF`;

    if (/(gross profit|revenue|cost of goods|margin)/.test(lowerMessage) && values.length >= 2) {
      const revenue = values[0];
      const costs = values[1];
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return `## Summary
Your calculated gross profit is **${format(profit)}**, representing a **${margin.toFixed(1)}% gross margin**.

## Your numbers
- Revenue: **${format(revenue)}**
- Cost of goods or operating cost: **${format(costs)}**

## Calculation
1. Gross profit = Revenue − Costs
2. Gross profit = ${format(revenue)} − ${format(costs)}
3. Gross profit = **${format(profit)}**
4. Gross margin = (${format(profit)} ÷ ${format(revenue)}) × 100 = **${margin.toFixed(1)}%**

## Recommended next steps
- Compare this margin with your previous recorded periods.
- Confirm that payroll, rent, tax, and financing costs are included before treating it as net profit.
- Record missing expenses in Elevata for a complete profitability assessment.`;
    }

    if (/(loan|afford|repay|credit)/.test(lowerMessage) && values.length >= 2) {
      const monthlySales = values[0];
      const marginPercent = values.find((value) => value > 0 && value <= 100) || 0;
      const months = [...values].reverse().find((value) => Number.isInteger(value) && value >= 3 && value <= 120) || 12;
      const monthlyProfit = monthlySales * (marginPercent / 100);
      const safePayment = monthlyProfit * 0.3;
      const indicativePrincipal = safePayment * months;
      return `## Summary
Using a conservative affordability rule, an indicative repayment ceiling is **${format(safePayment)} per month**.

## Your numbers
- Monthly sales: **${format(monthlySales)}**
- Stated profit margin: **${marginPercent}%**
- Repayment period: **${months} months**

## Calculation
1. Estimated monthly profit = Sales × Margin = **${format(monthlyProfit)}**
2. Conservative debt-service allowance = Profit × 30% = **${format(safePayment)}**
3. Indicative principal before interest = Payment × ${months} = **${format(indicativePrincipal)}**

## Important assumptions
- This estimate excludes interest, fees, existing debt, taxes, and seasonal cash-flow changes.
- It is guidance, not a credit approval or bank offer.

## Recommended next steps
- Add the proposed interest rate and existing monthly debt payments.
- Review at least six months of recorded cash flow.
- Keep total repayments below the calculated monthly ceiling.`;
    }

    const businessName = user?.business?.businessName || context.activeSmeName || 'your business';
    const revenue = Number(context.activeSmeRevenue || 0);
    const expenses = Number(context.activeSmeExpenses || 0);
    const balance = Number(context.activeSmeBalance || 0);
    return `## Summary
I can provide a professional assessment for **${businessName}**, but this question needs more numerical detail for a reliable calculation.

## Recorded Elevata data
- Available-period revenue: **${format(revenue)}**
- Available-period expenses: **${format(expenses)}**
- Recorded balance: **${format(balance)}**

## Information needed
- The exact amount or financial decision you want to evaluate
- The period involved, such as monthly or annual
- Relevant rates, costs, repayment term, or target margin

## Recommended next step
Ask a specific question such as: **“Calculate affordable monthly repayment using 4,000,000 RWF monthly sales, a 25% margin, and a 12-month term.”**`;
  }

  /**
   * Generates a context-aware system prompt tailored for Elevata users (SMEs or Financial Institutions).
   */
  getSystemPrompt(user, context = {}) {
    const role = user?.role || 'BUSINESS';
    const isFI = role === 'FINANCIAL_INSTITUTION';
    const isAdmin = role === 'ADMIN';

    if (isFI || isAdmin) {
      const fi = user?.financialInstitution || {};
      return `You are Elevata AI Banker Copilot, an expert financial analyst and lending intelligence assistant for Financial Institutions and Bank Officers on the Elevata platform in Rwanda.

Institution Context:
- Institution Name: ${fi.institutionName || 'Financial Institution'}
- Category: ${fi.category || 'Commercial Bank / Microfinance / SACCO'}
- Representative: ${fi.representativeName || user?.email || 'Officer'}
- Operating Scope: ${fi.operatingScope || 'National / Regional'}
- License Number: ${fi.licenseNumber || 'Verified Central Bank License'}

Your Core Capabilities:
1. SME Credit Risk Assessment: Help evaluate SME loan applications, risk indicators (cash flow volatility, inventory turnover, debt service ratio), and creditworthiness metrics.
2. Underwriting & Loan Criteria: Assist in structuring SME loan products, collateral-light facilities, inventory-backed loans, and working capital limits.
3. Market & Sector Intelligence: Provide data-driven insights on Rwandan market sectors (Retail, Agriculture, Light Manufacturing, Logistics, Tech).
4. Opportunity Publisher Guidance: Assist in designing targeted SME funding opportunities, grants, and competitive debt programs.

Guidelines:
- Provide structured, quantitative, and actionable banking insights.
- Use Rwandan Francs (RWF) as the primary currency when discussing amounts.
- Maintain professional, analytical, and objective financial terminology.
- Never invent portfolio figures, applicant facts, approvals, rates, or regulatory requirements. Clearly label assumptions and missing data.
- Recalculate every numerical result before answering. Show the formula, substituted values, result, and a short interpretation.
- Format every substantial answer as: **Executive summary**, **Calculation or assessment**, **Key risks**, and **Recommended next actions**.
- Use short markdown headings, numbered steps, and bullet points. Avoid markdown tables so the answer remains clean when copied.`;
    }

    // Default: SME (Business) Role with Operational & Strategic Profile
    const biz = user?.business || {};
    const op = biz.operational || businessService.getOperationalData(user?.id);

    const equipmentsSummary = Array.isArray(op.equipments) && op.equipments.length > 0
      ? op.equipments.map(e => `${e.name} (${e.category}, Valued at ${Number(e.value || 0).toLocaleString()} RWF)`).join('; ')
      : 'No equipment recorded';

    return `You are Elevata AI SME Assistant, an intelligent virtual CFO and business growth advisor for Small and Medium Enterprises (SMEs) on the Elevata platform in Rwanda.

Comprehensive SME Profile & Operational Intelligence:
- Business Name: ${biz.businessName || 'Business profile incomplete'}
- Owner / Managing Director: ${biz.ownerName || user?.email || 'Valued Entrepreneur'}
- Business Sector / Type: ${biz.businessType || 'Not provided'}
- Location: ${biz.district ? `${biz.district}, ${biz.province}` : 'Not provided'} (${biz.sector || ''} sector, ${biz.cell || ''} cell)
- Business Stage: ${op.businessStage || 'Not provided'}
- Target Customer Segment: ${op.targetMarket || 'Not provided'}
- Primary Products/Services: ${op.primaryProducts || 'Not provided'}

Operational & Capital Structure:
- Total Equipment & Machinery: ${Number(op.totalEquipmentValue || 0).toLocaleString()} RWF [${equipmentsSummary}]
- Total Assets: ${Number(op.totalAssets || 0).toLocaleString()} RWF (Current: ${Number(op.currentAssets || 0).toLocaleString()} RWF, Fixed: ${Number(op.fixedAssets || 0).toLocaleString()} RWF)
- Total Liabilities: ${Number(op.totalLiabilities || 0).toLocaleString()} RWF (Short-term: ${Number(op.shortTermLiabilities || 0).toLocaleString()} RWF, Long-term: ${Number(op.longTermLiabilities || 0).toLocaleString()} RWF)
- Owner's Capital / Equity: ${Number(op.ownerCapital || 0).toLocaleString()} RWF
- Estimated Monthly Turnover: ${Number(op.monthlyTurnover || 0).toLocaleString()} RWF (Annual: ${Number(op.annualRevenue || 0).toLocaleString()} RWF)
- Gross Profit Margin: ${op.grossMarginPercentage || 0}%
- Workforce: ${op.totalEmployees || 0} employees (${op.fullTimeEmployees || 0} Full-time, ${op.partTimeEmployees || 0} Part-time)
- Total Monthly Payroll: ${Number(op.monthlyPayroll || 0).toLocaleString()} RWF
- Strategic Challenges: ${op.operationalChallenges || 'Not provided'}
- Growth Goals: ${op.strategicGoals || 'Not provided'}
- Recorded Dashboard Balance: ${Number(context.activeSmeBalance || 0).toLocaleString()} RWF
- Recorded Revenue in Available Period: ${Number(context.activeSmeRevenue || 0).toLocaleString()} RWF
- Recorded Expenses in Available Period: ${Number(context.activeSmeExpenses || 0).toLocaleString()} RWF
- Inventory Value: ${Number(context.activeSmeInventoryValue || 0).toLocaleString()} RWF
- Financial Health Score: ${Number(context.activeSmeCreditScore || 0)}/100

Your Core Capabilities:
1. Financial Advisory: Cash flow optimization, expense reduction, inventory balance, and margin improvement.
2. Loan & Credit Readiness: Explain how to leverage existing assets & equipment to improve Elevata credit scores and qualify for bank working capital.
3. Balance Sheet & Asset Optimization: Advise on debt-to-equity ratio, machinery maintenance, and payroll-to-revenue efficiency.
4. Market & Growth Opportunities: Recommend growth strategies, technology adoption, and matching Elevata Opportunity Hub grants/loans.

Guidelines:
- Be encouraging, highly practical, and quantitative for an African / Rwandan SME business owner.
- Always use Rwandan Francs (RWF) as the currency.
- Never invent business records, market prices, loan rates, or eligibility. State exactly which information is missing.
- For calculations, show the formula, each input, the answer rounded sensibly, and what the result means.
- Distinguish recorded data from assumptions and projections.
- Format every substantial answer as: **Summary**, **Your numbers**, **Calculation**, and **Recommended next steps**.
- Keep advice step-by-step and actionable using short markdown headings, numbered lists, and bullets. Avoid markdown tables so copied answers remain readable.`;
  }

  /**
   * Sends chat message with history to OpenAI and returns AI reply.
   */
  async generateChatResponse({ user, message, history = [], context = {} }) {
    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message text is required', 400);
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_SECRET_KEY;
    if (!apiKey) {
      return {
        reply: this.generateCoreResponse(user, message.trim(), context),
        model: 'elevata-core',
        usage: null
      };
    }

    const systemPrompt = this.getSystemPrompt(user, context);

    // Format OpenAI messages array
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Include valid previous chat history (limit last 10 messages for context efficiency)
    if (Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-10);
      for (const item of recentHistory) {
        if (item.role && item.content && (item.role === 'user' || item.role === 'assistant')) {
          messages.push({
            role: item.role,
            content: String(item.content)
          });
        }
      }
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message.trim()
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.25,
          max_tokens: 1400,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        throw new AppError(
          errorData.error?.message || 'OpenAI service request failed',
          response.status === 401 ? 401 : 502
        );
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';

      return {
        reply,
        model: data.model || 'gpt-4o-mini',
        usage: data.usage || null
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('AI chat exception:', err);
      throw new AppError('Failed to communicate with AI Assistant. Please check server logs.', 500);
    }
  }

  /**
   * Returns recommended prompt suggestions based on user role and profile.
   */
  getQuickSuggestions(user) {
    const role = user?.role || 'BUSINESS';
    if (role === 'FINANCIAL_INSTITUTION' || role === 'ADMIN') {
      return [
        {
          id: 'fi_1',
          title: 'Assess SME Credit Risk',
          prompt: 'What are the top credit risk indicators I should inspect when reviewing a retail SME with fluctuating cash flow in Kigali?'
        },
        {
          id: 'fi_2',
          title: 'Design Working Capital Loan',
          prompt: 'Draft underwriting criteria and repayment terms for an inventory-backed working capital loan for agri-processing SMEs.'
        },
        {
          id: 'fi_3',
          title: 'Portfolio Health Benchmarks',
          prompt: 'How can financial institutions minimize NPLs (non-performing loans) when lending to micro and small businesses?'
        },
        {
          id: 'fi_4',
          title: 'Evaluate Loan Application',
          prompt: 'Provide a structured rubric to assess an SME applying for 5,000,000 RWF with 24 months operating history.'
        }
      ];
    }

    // SME suggestions
    return [
      {
        id: 'sme_1',
        title: 'Improve Credit Score',
        prompt: 'How can I improve my business credit score on Elevata to qualify for lower interest bank loans?'
      },
      {
        id: 'sme_2',
        title: 'Calculate Loan Affordability',
        prompt: 'If my monthly sales are 3,500,000 RWF with 25% profit margin, what loan amount can I comfortably repay over 12 months?'
      },
      {
        id: 'sme_3',
        title: 'Optimize Inventory & Expenses',
        prompt: 'What strategies can I use to reduce dead inventory and cut unnecessary operating expenses in my retail store?'
      },
      {
        id: 'sme_4',
        title: 'Find Business Grants & Opportunities',
        prompt: 'What funding opportunities, grants, or equipment financing options are best suited for growing Rwandan SMEs?'
      }
    ];
  }
}

export default new AIService();
