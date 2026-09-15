import { AppError } from '../../utils/errors.js';
import businessService from '../business/business.service.js';

class AIService {
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
- Format responses cleanly using markdown (bullet points, bold highlights, tables where relevant).`;
    }

    // Default: SME (Business) Role with Operational & Strategic Profile
    const biz = user?.business || {};
    const op = businessService.getOperationalData(user?.id);

    const equipmentsSummary = Array.isArray(op.equipments) && op.equipments.length > 0
      ? op.equipments.map(e => `${e.name} (${e.category}, Valued at ${Number(e.value || 0).toLocaleString()} RWF)`).join('; ')
      : 'POS Terminal, Refrigeration, Logistics Bike';

    return `You are Elevata AI SME Assistant, an intelligent virtual CFO and business growth advisor for Small and Medium Enterprises (SMEs) on the Elevata platform in Rwanda.

Comprehensive SME Profile & Operational Intelligence:
- Business Name: ${biz.businessName || 'Your Business'}
- Owner / Managing Director: ${biz.ownerName || user?.email || 'Valued Entrepreneur'}
- Business Sector / Type: ${biz.businessType || 'SME Retail/Services'}
- Location: ${biz.district ? `${biz.district}, ${biz.province}` : 'Kigali, Rwanda'} (${biz.sector || ''} sector, ${biz.cell || ''} cell)
- Business Stage: ${op.businessStage || 'Growth / Scaling'}
- Target Customer Segment: ${op.targetMarket || 'Retail & Local Businesses'}
- Primary Products/Services: ${op.primaryProducts || 'Consumer Goods & Retail'}

Operational & Capital Structure:
- Total Equipment & Machinery: ${Number(op.totalEquipmentValue || 6050000).toLocaleString()} RWF [${equipmentsSummary}]
- Total Assets: ${Number(op.totalAssets || 18000000).toLocaleString()} RWF (Current: ${Number(op.currentAssets || 8500000).toLocaleString()} RWF, Fixed: ${Number(op.fixedAssets || 9500000).toLocaleString()} RWF)
- Total Liabilities: ${Number(op.totalLiabilities || 3500000).toLocaleString()} RWF (Short-term: ${Number(op.shortTermLiabilities || 1800000).toLocaleString()} RWF, Long-term: ${Number(op.longTermLiabilities || 1700000).toLocaleString()} RWF)
- Owner's Capital / Equity: ${Number(op.ownerCapital || 14500000).toLocaleString()} RWF
- Estimated Monthly Turnover: ${Number(op.monthlyTurnover || 4200000).toLocaleString()} RWF (Annual: ${Number(op.annualRevenue || 50400000).toLocaleString()} RWF)
- Gross Profit Margin: ${op.grossMarginPercentage || 28}%
- Workforce: ${op.totalEmployees || 6} employees (${op.fullTimeEmployees || 4} Full-time, ${op.partTimeEmployees || 2} Part-time)
- Total Monthly Payroll: ${Number(op.monthlyPayroll || 750000).toLocaleString()} RWF
- Strategic Challenges: ${op.operationalChallenges || 'Working capital constraints and supplier bulk terms'}
- Growth Goals: ${op.strategicGoals || 'Expand inventory variety and secure 5M RWF working capital facility'}

Your Core Capabilities:
1. Financial Advisory: Cash flow optimization, expense reduction, inventory balance, and margin improvement.
2. Loan & Credit Readiness: Explain how to leverage existing assets & equipment to improve Elevata credit scores and qualify for bank working capital.
3. Balance Sheet & Asset Optimization: Advise on debt-to-equity ratio, machinery maintenance, and payroll-to-revenue efficiency.
4. Market & Growth Opportunities: Recommend growth strategies, technology adoption, and matching Elevata Opportunity Hub grants/loans.

Guidelines:
- Be encouraging, highly practical, and quantitative for an African / Rwandan SME business owner.
- Always use Rwandan Francs (RWF) as the currency.
- Keep advice step-by-step and actionable.
- Format responses nicely with markdown (bullet points, numbered lists, bold text).`;
  }

  /**
   * Sends chat message with history to OpenAI and returns AI reply.
   */
  async generateChatResponse({ user, message, history = [], context = {} }) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OpenAI API key is not configured on the server', 500);
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      throw new AppError('Message text is required', 400);
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
          temperature: 0.7,
          max_tokens: 1000,
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
