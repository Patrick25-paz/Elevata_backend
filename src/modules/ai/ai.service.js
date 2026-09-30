import { AppError } from '../../utils/errors.js';
import businessService from '../business/business.service.js';

class AIService {
  /**
   * Comprehensive offline rule-based knowledge engine grounded strictly in Elevata's platform architecture.
   */
  generateCoreResponse(user, message, context = {}) {
    const role = user?.role || 'BUSINESS';
    const isFI = role === 'FINANCIAL_INSTITUTION';
    const isAdmin = role === 'ADMIN';

    const values = [...message.matchAll(/(?:RWF\s*)?(\d[\d,]*(?:\.\d+)?)/gi)]
      .map((match) => Number(match[1].replace(/,/g, '')))
      .filter(Number.isFinite);
    const lowerMessage = message.toLowerCase();
    const format = (value) => `${Math.round(value).toLocaleString('en-US')} RWF`;

    const bizName = user?.business?.businessName || context.activeSmeName || 'your business';
    const sector = user?.business?.businessType || context.activeSmeSector || 'Commercial';
    const fiName = user?.financialInstitution?.institutionName || context.institutionName || 'your Financial Institution';

    // 1. What is Elevata / About Elevata / Platform Overview
    if (/(what is elevata|about elevata|how does elevata work|elevata platform|what can elevata do)/.test(lowerMessage)) {
      return `## Elevata Platform Intelligence
**Elevata** is an AI-powered Financial Opportunity Intelligence Platform that bridges the gap between Financial Institutions and Small & Medium Enterprises (SMEs) through intelligent opportunity matching, continuous business monitoring, and targeted engagement.

## Core Pillars & Capabilities
1. **Intelligent Opportunity Matching**
   - Financial institutions and fintechs publish loans, grants, insurance, digital financial services (DFS), savings/investment products, and capacity-building trainings.
   - Elevata evaluates each SME’s business profile, sector, financial performance, business activities, and readiness score to recommend the highest-probability opportunities.

2. **Continuous Business Monitoring & Readiness**
   - SMEs maintain digital records of sales, inventory intakes, and cash flows.
   - Elevata generates real-time financial health scores (0–100), debt-service ratios, and highlights missing qualification requirements (e.g. registration, tax compliance, or bookkeeping history).

3. **Targeted Engagement & Capacity Building**
   - Financial institutions identify creditworthy SMEs, monitor portfolio health trends, and host virtual financial literacy sessions.
   - SMEs gain access to interactive webinars and targeted training to build financing readiness.

## How to Get Started
- **SMEs:** Complete your business & operational profile, record daily sales/expenses, and explore matched opportunities in the **Opportunity Hub**.
- **Financial Institutions:** Publish tailored financing products or schedule capacity-building trainings to engage pre-screened SMEs.`;
    }

    // 2. Health Score & Readiness Improvement
    if (/(health score|readiness|improve score|credit score|qualification|eligibility criteria|missing requirements)/.test(lowerMessage)) {
      const currentScore = context.activeSmeCreditScore || user?.business?.operational?.healthScore || 65;
      return `## Financial Health & Readiness Assessment for ${bizName}
Your current Elevata Financial Health Score is **${currentScore}/100**. Elevata calculates this score by analyzing your continuous business records, cash flow consistency, and operational readiness.

## How to Improve Your Score on Elevata
1. **Consistent Business Activity Logging**
   - Record daily sales and inventory intakes in the **Sales & Inventory** modules. Consistent records demonstrate operational transparency to lenders.
2. **Positive Cash Flow & Working Capital**
   - Maintain a minimum current ratio above **1.5x** and maintain recorded positive operating cash flow.
3. **Formal Regulatory Compliance**
   - Ensure your RDB Business Registration and RRA Tax Clearance are up-to-date in your operational profile.
4. **Capacity Building & Training**
   - Enroll in and complete Elevata **Virtual Financial Literacy & Business Training** sessions to earn verified completion badges.
5. **Asset & Equipment Documentation**
   - Keep your equipment and inventory valuations updated to unlock asset-backed and collateral-light loan facilities.

## Recommended Next Steps
- Navigate to **Business Profile > Operational Structure** to update your asset and machinery records.
- Check the **Opportunity Hub** to view specific eligibility benchmarks required by Rwandan financial institutions.`;
    }

    // 3. Profit Margin & Financial Calculation
    if (/(gross profit|revenue|cost of goods|margin|operating profit|break even)/.test(lowerMessage) && values.length >= 2) {
      const revenue = values[0];
      const costs = values[1];
      const profit = revenue - costs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return `## Profitability Assessment for ${bizName}
Your calculated gross profit is **${format(profit)}**, representing a **${margin.toFixed(1)}% gross profit margin**.

## Your Numbers
- **Total Revenue / Turnover:** ${format(revenue)}
- **Cost of Goods / Direct Operating Expenses:** ${format(costs)}

## Calculation Breakdown
1. **Gross Profit** = Revenue − Direct Costs
2. **Gross Profit** = ${format(revenue)} − ${format(costs)} = **${format(profit)}**
3. **Gross Margin** = (${format(profit)} ÷ ${format(revenue)}) × 100 = **${margin.toFixed(1)}%**

## Elevata Opportunity Alignment
- Rwandan financial institutions typically look for stable margins (>20%) when evaluating working capital and trade finance facilities.
- **Next Action:** Log this period's ledger entries into Elevata to automatically update your rolling Financial Health Score.`;
    }

    // 4. Loan Affordability & Debt Service Calculation
    if (/(loan|afford|repay|credit|borrow|debt capacity|interest)/.test(lowerMessage) && values.length >= 2) {
      const monthlySales = values[0];
      const marginPercent = values.find((value) => value > 0 && value <= 100) || 25;
      const months = [...values].reverse().find((value) => Number.isInteger(value) && value >= 3 && value <= 120) || 12;
      const monthlyProfit = monthlySales * (marginPercent / 100);
      const safePayment = monthlyProfit * 0.30;
      const indicativePrincipal = safePayment * months;

      return `## Debt Capacity & Affordability Guidance for ${bizName}
Based on Elevata's conservative debt-service model (30% DSCR buffer), your indicative safe monthly repayment ceiling is **${format(safePayment)} / month**.

## Your Evaluation Parameters
- **Monthly Revenue:** ${format(monthlySales)}
- **Estimated Net Margin:** ${marginPercent}%
- **Proposed Repayment Term:** ${months} months
- **Estimated Monthly Operating Profit:** ${format(monthlyProfit)}

## Calculation & Debt Capacity
1. **Monthly Operating Profit** = ${format(monthlySales)} × ${marginPercent}% = **${format(monthlyProfit)}**
2. **Max Safe Debt Repayment (30% ceiling)** = ${format(monthlyProfit)} × 0.30 = **${format(safePayment)}**
3. **Indicative Borrowing Capacity (Principal before interest)** = ${format(safePayment)} × ${months} = **${format(indicativePrincipal)}**

## Elevata Readiness & Underwriting Insights
- **Debt Service Coverage Ratio (DSCR):** Lenders on Elevata prefer debt payments not exceeding 30–35% of net monthly operating cash flow.
- **Collateral & Alternatives:** If this principal falls short of your growth requirements, look for **inventory-backed credit** or **matching grants** in the Opportunity Hub.

## Recommended Next Steps
- Verify your last 3–6 months of bank or mobile money statements against your Elevata sales records.
- Browse **Active Opportunities** to compare current interest rates and terms from participating banks and SACCOs.`;
    }

    // 5. Opportunities / Grants / Loans Matching
    if (/(opportunity|opportunities|grant|grants|loans|products|match|find funding|dfs|insurance)/.test(lowerMessage)) {
      const activeOpps = Array.isArray(context.availableOpportunities) ? context.availableOpportunities : [];

      if (activeOpps.length > 0) {
        // Matching active opportunities from Elevata database
        const oppsList = activeOpps.map((opp, idx) => {
          const reqs = [
            opp.minHealthScore ? `Min Health Score: ${opp.minHealthScore}/100` : null,
            opp.minRevenue ? `Min Revenue: ${Number(opp.minRevenue).toLocaleString()} RWF` : null,
            opp.registrationRequired ? 'Registration Required' : null,
            opp.taxCompliance ? 'Tax Compliance' : null,
            opp.collateralRequired ? 'Collateral Required' : 'Collateral-free'
          ].filter(Boolean).join(' • ');

          return `### ${idx + 1}. ${opp.title}
- **Publishing Institution:** ${opp.institution}
- **Category:** ${opp.category}
- **Max Funding / Value:** ${opp.maxFunding || 'Not specified'}
- **Deadline:** ${opp.deadline || 'Ongoing'}
- **Target Sectors:** ${opp.sectors && opp.sectors.length > 0 ? opp.sectors.join(', ') : 'All Sectors'}
- **Eligibility Criteria:** ${reqs || 'Open eligibility'}
- **Overview:** ${opp.description || 'Verified financing product on Elevata.'}`;
        }).join('\n\n');

        return `## Active Published Opportunities on Elevata for ${bizName}
Elevata found **${activeOpps.length} verified active opportunity${activeOpps.length > 1 ? 'ies' : 'y'}** published by financial institutions and development partners in the database:

${oppsList}

## Recommended Next Steps
- Review each opportunity's eligibility criteria against your current recorded Financial Health Score.
- Head over to the **Opportunity Hub** in your left navigation to submit your application directly.`;
      }

      // Fallback if no published opportunities currently exist in the database
      return `## Available Opportunity Categories for ${bizName} (${sector})
There are currently **no active published opportunities** listed in the Elevata database for your profile right now. However, financial institutions regularly publish new programs. Here are the primary opportunity types you can qualify for on Elevata:

## Standard Elevata Opportunity Types
1. **Working Capital & Inventory Loans**
   - Short to medium term credit lines for stock purchase, supplier payments, and seasonal expansion.
2. **Matching Grants & Challenge Funds**
   - Non-repayable capital for women/youth-led businesses, tech adoption, climate-smart agriculture, and export development.
3. **Asset & Equipment Financing**
   - Asset-backed leasing for machinery, solar installations, and commercial vehicles.
4. **Digital Financial Services (DFS) & Merchant Credit**
   - Revenue-based financing tied to MoMo / POS transaction volumes.
5. **Micro-Insurance & Protection**
   - Agriculture yield insurance, inventory fire/theft coverage, and credit life policies.

## How to Prepare for New Published Opportunities
- Maintain consistent daily transaction records in **Sales** and **Inventory** to boost your Financial Health Score.
- Ensure your business registration (RDB) and tax compliance status are up to date.
- As soon as a financial institution publishes a matching program, Elevata will automatically notify you.`;
    }

    // 6. Virtual Training & Capacity Building
    if (/(training|webinar|literacy|skills|capacity|session|workshop)/.test(lowerMessage)) {
      return `## Virtual Financial Literacy & Training Hub
Elevata hosts structured virtual training sessions and masterclasses designed by financial institutions and SME development specialists.

## Benefits of Participating
- **Direct Banker Engagement:** Learn directly from credit officers what makes a loan application successful.
- **Boost Your Readiness Score:** Completing certified Elevata modules adds verified credentials to your profile.
- **Topic Coverage:** Bookkeeping best practices, tax compliance (RRA), working capital optimization, and digital marketing.

## Recommended Next Steps
- Go to the **Trainings & Webinars** section on your navigation menu to view upcoming live sessions and enroll.`;
    }

    // 7. Financial Institution Specific Guidance
    if (isFI || isAdmin) {
      return `## Elevata Banker Intelligence Summary for ${fiName}
Elevata provides lending intelligence to screen SME creditworthiness, structure tailored financial products, and monitor portfolio trends across Rwanda.

## Key Capabilities for Financial Institutions
1. **Opportunity Publishing:** Launch specialized loans, grants, and DFS products with custom eligibility filters (min revenue, sector, readiness score).
2. **SME Portfolio Monitoring:** Track continuous cash flow health, inventory turnover, and early delinquency warning indicators.
3. **Targeted Engagement & Literacy:** Host virtual training sessions to prepare prospective borrowers and de-risk your lending pipeline.

## Recommended Next Action
- Access the **Opportunities Management** dashboard to review incoming SME applications or publish new SME credit products.`;
    }

    // Default SME contextual response
    const revenue = Number(context.activeSmeRevenue || 0);
    const expenses = Number(context.activeSmeExpenses || 0);
    const balance = Number(context.activeSmeBalance || 0);

    return `## Elevata Copilot Overview for ${bizName}
I am your dedicated **Elevata Financial Opportunity Intelligence Copilot**. I analyze your continuous business performance, calculate financing metrics, and connect you with verified financial opportunities.

## Your Recorded Profile Snapshot
- **Business:** ${bizName} (${sector})
- **Recorded Revenue in Period:** ${format(revenue)}
- **Recorded Expenses in Period:** ${format(expenses)}
- **Current Balance:** ${format(balance)}

## What would you like to explore today?
1. **Evaluate Loan & Debt Affordability:** Ask for a debt capacity analysis by stating your monthly sales, margin, and desired term.
2. **Discover Matched Opportunities:** Inquire about grants, working capital loans, or digital financial solutions for ${sector}.
3. **Improve Health & Readiness Scores:** Learn how to fulfill bank requirements and boost your borrowing profile.
4. **Explore Virtual Trainings:** Discover upcoming financial literacy sessions to strengthen your management capacity.`;
  }

  /**
   * Generates a context-aware system prompt tailored for Elevata users (SMEs, Financial Institutions, and Admins).
   */
  getSystemPrompt(user, context = {}) {
    const role = user?.role || 'BUSINESS';
    const isFI = role === 'FINANCIAL_INSTITUTION';
    const isAdmin = role === 'ADMIN';

    const activeOpps = Array.isArray(context.availableOpportunities) ? context.availableOpportunities : [];
    const oppsSummary = activeOpps.length > 0
      ? activeOpps.map((o, idx) => `${idx + 1}. **${o.title}** by *${o.institution}* [Category: ${o.category} | Max Funding: ${o.maxFunding} | Deadline: ${o.deadline} | Target Sectors: ${o.sectors?.join(', ') || 'All Sectors'} | Min Health Score: ${o.minHealthScore}/100 | Min Monthly Revenue: ${Number(o.minRevenue || 0).toLocaleString()} RWF | Requirements: ${[o.registrationRequired ? 'Registration Required' : null, o.taxCompliance ? 'Tax Compliance' : null, o.collateralRequired ? 'Collateral Required' : 'Collateral-free'].filter(Boolean).join(', ')}] - Description: ${o.description}`).join('\n')
      : 'No active opportunities currently published in database.';

    const elevataCoreMission = `
Elevata System Definition & Core Architecture:
- Elevata is an AI-powered Financial Opportunity Intelligence Platform that connects financial institutions with SMEs through intelligent opportunity matching, continuous business monitoring, and targeted engagement.
- Financial institutions and fintechs can publish loans, grants, insurance, digital financial services (DFS), savings and investment products, training, and other SME support opportunities.
- Elevata uses each SME's business profile, sector, financial performance, business activities, needs, and readiness to identify and recommend relevant opportunities.
- SMEs record their business activities (sales, inventory, expenses, assets) and receive personalized recommendations, eligibility information, guidance on missing requirements, financing-readiness insights, and access to virtual financial literacy and business training.
- Financial institutions identify relevant SMEs, monitor business and readiness trends, conduct targeted training and awareness sessions, and track engagement and applications.
- Mission: Connect SME business intelligence with available financial opportunities to improve utilization of existing financial products, reduce missed qualified SMEs, and increase awareness and adoption of financial and digital solutions.

Active Published Opportunities in Elevata Database:
${oppsSummary}

Opportunity Query Instructions:
- When the user asks about available opportunities, loans, grants, investments, DFS, or support programs:
  1. FIRST inspect the "Active Published Opportunities in Elevata Database" list above.
  2. If matching published opportunities exist in the database, present and recommend them with their title, publishing institution, category, maximum funding/benefits, deadline, and eligibility criteria matching the user's business profile.
  3. If NO active opportunities are published in the database (or none match their criteria), explicitly state that no active published opportunities are currently listed in the system, and THEN provide generic opportunity categories (Working Capital Loans, Matching Grants, DFS, Asset Financing, Micro-Insurance) and explain how the user can improve their readiness score to qualify once new opportunities are published.
`;


    if (isFI || isAdmin) {
      const fi = user?.financialInstitution || {};
      const stats = context.fiStats || {};
      return `You are the Elevata AI Banker Copilot, an expert lending intelligence and portfolio analytics advisor for Financial Institutions and Bank Officers on the Elevata platform in Rwanda.

${elevataCoreMission}

Institution Context & Profile:
- Institution Name: ${fi.institutionName || context.institutionName || 'Financial Institution'}
- Category: ${fi.category || 'Commercial Bank / Microfinance / SACCO / Fintech'}
- Officer / Representative: ${fi.representativeName || context.representativeName || user?.email || 'Credit Officer'}
- Operating Scope: ${fi.operatingScope || 'National / Regional Rwanda'}
- License Number: ${fi.licenseNumber || 'Verified BNR / Central Bank License'}
- Active Published Opportunities: ${stats.publishedCount ?? context.publishedCount ?? 'Active'}
- Total SME Applications Managed: ${stats.applicationsCount ?? context.applicationsCount ?? 'N/A'}

Your Core Capabilities & Guidelines:
1. SME Credit Risk Assessment: Help evaluate SME loan applications, risk indicators (cash flow volatility, inventory velocity, debt-service coverage ratio DSCR), and creditworthiness metrics based on continuous business records.
2. Product Structuring & Opportunity Publishing: Assist in designing targeted SME financial products (inventory-backed loans, invoice discounting, asset financing, matching grants, digital merchant credit) with precise eligibility thresholds.
3. Portfolio Monitoring & NPL Prevention: Provide early warning indicators for delinquency and advise on maintaining portfolio NPL ratios below 3%.
4. Capacity Building & Targeted Engagement: Guide officers on hosting virtual financial literacy training sessions and webinars on Elevata to pre-qualify and de-risk prospective SME borrowers.

Operational Rules:
- Always reference Rwandan Francs (RWF) as the standard currency.
- Ground advice in National Bank of Rwanda (BNR) prudential norms and commercial best practices.
- Structure complex answers with: **Executive Summary**, **Assessment & Calculations**, **Key Risk Factors**, and **Recommended Action Steps**.
- Always maintain an objective, data-driven, and professional banking tone.`;
    }

    // Default: SME (Business) Role with Operational & Strategic Profile
    const biz = user?.business || {};
    const op = biz.operational || businessService.getOperationalData(user?.id);

    const equipmentsSummary = Array.isArray(op.equipments) && op.equipments.length > 0
      ? op.equipments.map(e => `${e.name} (${e.category}, Valued at ${Number(e.value || 0).toLocaleString()} RWF)`).join('; ')
      : 'No machinery/equipment recorded yet';

    const smeStats = context.smeStats || {};

    return `You are the Elevata AI SME Copilot, an intelligent virtual CFO and business growth advisor dedicated to Small and Medium Enterprises on the Elevata platform in Rwanda.

${elevataCoreMission}

Active SME Profile & Operational Intelligence:
- Business Name: ${biz.businessName || context.activeSmeName || 'Business Profile Incomplete'}
- Owner / Managing Director: ${biz.ownerName || user?.email || 'Valued Entrepreneur'}
- Business Sector / Type: ${biz.businessType || context.activeSmeSector || 'Retail / Commerce'}
- Location: ${biz.district ? `${biz.district}, ${biz.province}` : 'Rwanda'} (${biz.sector ? `${biz.sector} sector` : ''})
- Business Stage: ${op.businessStage || 'Growing SME'}
- Target Customer Segment: ${op.targetMarket || 'Local & regional buyers'}
- Primary Products/Services: ${op.primaryProducts || 'General Goods & Services'}

Financial & Balance Sheet Snapshot:
- Total Equipment & Machinery Value: ${Number(op.totalEquipmentValue || 0).toLocaleString()} RWF [${equipmentsSummary}]
- Total Assets: ${Number(op.totalAssets || 0).toLocaleString()} RWF (Current: ${Number(op.currentAssets || 0).toLocaleString()} RWF, Fixed: ${Number(op.fixedAssets || 0).toLocaleString()} RWF)
- Total Liabilities: ${Number(op.totalLiabilities || 0).toLocaleString()} RWF (Short-term: ${Number(op.shortTermLiabilities || 0).toLocaleString()} RWF, Long-term: ${Number(op.longTermLiabilities || 0).toLocaleString()} RWF)
- Owner's Capital / Equity: ${Number(op.ownerCapital || 0).toLocaleString()} RWF
- Estimated Monthly Turnover: ${Number(op.monthlyTurnover || 0).toLocaleString()} RWF (Annual: ${Number(op.annualRevenue || 0).toLocaleString()} RWF)
- Gross Profit Margin: ${op.grossMarginPercentage || 0}%
- Workforce: ${op.totalEmployees || 0} employees (${op.fullTimeEmployees || 0} Full-time, ${op.partTimeEmployees || 0} Part-time)
- Total Monthly Payroll: ${Number(op.monthlyPayroll || 0).toLocaleString()} RWF
- Recorded Period Revenue: ${Number(context.activeSmeRevenue || 0).toLocaleString()} RWF
- Recorded Period Expenses: ${Number(context.activeSmeExpenses || 0).toLocaleString()} RWF
- Current Dashboard Balance: ${Number(context.activeSmeBalance || 0).toLocaleString()} RWF
- Inventory Valuation: ${Number(context.activeSmeInventoryValue || 0).toLocaleString()} RWF
- Elevata Financial Health Score: ${Number(context.activeSmeCreditScore || op.healthScore || 0)}/100
- Active Opportunity Applications: ${smeStats.appliedCount ?? context.appliedCount ?? '0'}

Your Core Capabilities & Guidelines:
1. Intelligent Opportunity Matching: Guide the SME to identify, evaluate, and apply for matched loans, grants, insurance, DFS, and training opportunities on Elevata. Explain eligibility criteria and guide them on closing missing requirements.
2. Continuous Business Monitoring: Review their sales, expenses, and inventory trends recorded in Elevata to give proactive financial advice.
3. Financial Health & Readiness Improvement: Explain how to increase their Elevata Health Score (maintaining digital ledgers, tax compliance, positive working capital, debt service discipline) to qualify for lower interest rates and higher credit limits.
4. Capacity Building: Encourage participation in Elevata virtual financial literacy webinars and business trainings.
5. Accurate Calculations: For any calculation, show the explicit formula, substituted numbers in Rwandan Francs (RWF), the calculated result, and practical interpretation.

Response Structure:
- Format substantial answers as: **Summary**, **Your Numbers & Status**, **Assessment / Calculation**, and **Recommended Next Steps**.
- Maintain an encouraging, highly practical, and business-focused tone.`;
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
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API Error:', errorData);
        // Fallback to core offline response if API quota/credentials fail
        return {
          reply: this.generateCoreResponse(user, message.trim(), context),
          model: 'elevata-core-fallback',
          usage: null
        };
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || this.generateCoreResponse(user, message.trim(), context);

      return {
        reply,
        model: data.model || 'gpt-4o-mini',
        usage: data.usage || null
      };
    } catch (err) {
      console.error('AI chat exception, falling back to core response:', err);
      return {
        reply: this.generateCoreResponse(user, message.trim(), context),
        model: 'elevata-core-fallback',
        usage: null
      };
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
          prompt: 'What key credit risk metrics and cash flow indicators should I evaluate before approving an SME working capital loan on Elevata?'
        },
        {
          id: 'fi_2',
          title: 'Publish Tailored Opportunity',
          prompt: 'Help me design eligibility criteria and repayment terms for an inventory-backed credit line for retail and agri-SMEs.'
        },
        {
          id: 'fi_3',
          title: 'Continuous Portfolio Monitoring',
          prompt: 'How can our credit team leverage Elevata’s continuous business monitoring to maintain an NPL ratio below 3%?'
        },
        {
          id: 'fi_4',
          title: 'Host Virtual Literacy Training',
          prompt: 'Suggest a high-impact webinar curriculum for SMEs to improve their financial recordkeeping and loan readiness.'
        }
      ];
    }

    // SME suggestions
    return [
      {
        id: 'sme_1',
        title: 'Improve Health & Readiness Score',
        prompt: 'What specific business practices, records, and compliance steps will increase my Elevata Financial Health Score?'
      },
      {
        id: 'sme_2',
        title: 'Calculate Loan Affordability',
        prompt: 'If my monthly sales are 4,500,000 RWF with a 25% profit margin, what loan repayment can I comfortably afford over 12 months?'
      },
      {
        id: 'sme_3',
        title: 'Find Matched Opportunities',
        prompt: 'What loans, grants, digital financial services, or equipment financing opportunities match my business profile on Elevata?'
      },
      {
        id: 'sme_4',
        title: 'Virtual Training & Capacity Building',
        prompt: 'How do virtual financial literacy and business training sessions on Elevata help me qualify for financing?'
      }
    ];
  }
}

export default new AIService();

