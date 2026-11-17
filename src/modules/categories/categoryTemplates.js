/**
 * Business category templates.
 *
 * A template tells the frontend how to adapt the Business Profile, Business
 * Activities and Reports pages to a kind of business: wording, which journals
 * to show, units, expense categories, extra profile fields and report KPIs.
 *
 * Each category row may store a partial `config`; it is merged over the
 * built-in default for that category (or the generic BASE_TEMPLATE).
 */

export const TEMPLATE_VERSION = 1;

/** KPI formulas the frontend knows how to compute. */
export const KPI_FORMULAS = [
  'gross_margin',          // gross profit / revenue
  'net_margin',            // net profit / revenue
  'cogs_ratio',            // cost of goods sold / revenue (e.g. food cost %)
  'revenue_per_employee',  // revenue / total employees (profile)
  'revenue_per_unit',      // revenue / profile field named by `field`
  'expense_ratio',         // operating expenses / revenue
  'receivables_ratio',     // unpaid sales / revenue
  'average_sale'           // revenue / number of sales
];

export const BASE_TEMPLATE = {
  version: TEMPLATE_VERSION,
  icon: 'briefcase',
  description: 'General business that sells products or services.',
  sells: 'goods', // goods | services | mixed
  tracksStock: true,
  terms: {
    customer: 'Customer',
    customers: 'Customers',
    supplier: 'Supplier',
    product: 'Product',
    products: 'Products',
    sale: 'Sale',
    sales: 'Sales',
    purchase: 'Purchase',
    purchases: 'Purchases'
  },
  journals: {
    sales: { enabled: true, label: 'Sales' },
    purchases: { enabled: true, label: 'Purchases' },
    cash_in: { enabled: true, label: 'Cash In' },
    cash_out: { enabled: true, label: 'Cash Out & Expenses' },
    other: { enabled: true, label: 'Activities & Milestones' }
  },
  units: ['pcs', 'kgs', 'l', 'box', 'bag', 'packs', 'dozen', 'meters', 'tons', 'pairs', 'm²', 'other'],
  customerSegments: [
    { value: 'retail', label: 'Individual / walk-in' },
    { value: 'wholesale', label: 'Wholesale / reseller' },
    { value: 'institution', label: 'Institution / company' }
  ],
  /** Extra operating-expense categories on top of the standard list. */
  expenseCategories: [],
  milestoneCategories: ['Milestone', 'License / permit', 'New contract', 'Training', 'Expansion'],
  equipmentCategories: [
    'Technology & Computers',
    'Storage & Refrigeration',
    'Logistics & Transport',
    'Power & Backup Energy',
    'Manufacturing & Tools',
    'Office Furniture & Fixtures',
    'Other Assets'
  ],
  /** Extra fields shown on the Business Profile, saved under operational.sectorDetails. */
  profileFields: [],
  kpis: [
    { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
    { key: 'expense_ratio', label: 'Expenses as % of revenue', formula: 'expense_ratio' },
    { key: 'average_sale', label: 'Average sale', formula: 'average_sale' }
  ]
};

const services = (overrides) => ({
  sells: 'services',
  tracksStock: false,
  journals: {
    purchases: { enabled: true, label: 'Supplies' }
  },
  units: ['service', 'hour', 'session', 'day', 'month', 'pcs', 'other'],
  ...overrides
});

export const DEFAULT_TEMPLATES = {
  'Retail & Wholesale': {
    icon: 'store',
    description: 'Shops, supermarkets, boutiques and wholesalers buying and reselling goods.',
    expenseCategories: ['Shop supplies & packaging'],
    profileFields: [
      { key: 'outlets', label: 'Number of shops / outlets', type: 'number' },
      { key: 'floorArea', label: 'Shop floor area', type: 'number', unit: 'm²' }
    ],
    kpis: [
      { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
      { key: 'receivables_ratio', label: 'Sales not paid yet', formula: 'receivables_ratio' },
      { key: 'revenue_per_outlet', label: 'Revenue per outlet', formula: 'revenue_per_unit', field: 'outlets' }
    ]
  },
  'Agriculture & Agribusiness': {
    icon: 'sprout',
    description: 'Farms, cooperatives, livestock and agro-processing.',
    terms: { customer: 'Buyer', customers: 'Buyers', product: 'Produce', products: 'Produce', sale: 'Harvest sale', sales: 'Harvest sales', purchase: 'Input purchase', purchases: 'Inputs' },
    journals: { purchases: { enabled: true, label: 'Farm Inputs' }, sales: { enabled: true, label: 'Harvest Sales' } },
    units: ['kgs', 'tons', 'bag', 'l', 'crates', 'heads', 'pcs', 'other'],
    customerSegments: [
      { value: 'retail', label: 'Market / individual buyer' },
      { value: 'cooperative', label: 'Cooperative' },
      { value: 'processor', label: 'Processor / exporter' },
      { value: 'institution', label: 'Institution / school' }
    ],
    expenseCategories: ['Seeds & seedlings', 'Fertilizer & pesticides', 'Animal feed & vet', 'Casual farm labour', 'Irrigation'],
    milestoneCategories: ['Planting', 'Harvest', 'Season start', 'Certification', 'Cooperative meeting'],
    equipmentCategories: ['Tractors & tillers', 'Irrigation equipment', 'Storage & drying', 'Processing machines', 'Transport', 'Other Assets'],
    profileFields: [
      { key: 'landSizeHa', label: 'Land under cultivation', type: 'number', unit: 'ha' },
      { key: 'mainCrops', label: 'Main crops / livestock', type: 'text', placeholder: 'e.g. maize, beans, dairy cows' },
      { key: 'seasonsPerYear', label: 'Growing seasons per year', type: 'number' }
    ],
    kpis: [
      { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
      { key: 'revenue_per_ha', label: 'Revenue per hectare', formula: 'revenue_per_unit', field: 'landSizeHa' },
      { key: 'expense_ratio', label: 'Input & running costs as % of revenue', formula: 'expense_ratio' }
    ]
  },
  'Food Services & Hospitality': {
    icon: 'utensils',
    description: 'Restaurants, cafés, bars, hotels and catering.',
    terms: { customer: 'Guest', customers: 'Guests', product: 'Menu item', products: 'Menu items', purchase: 'Ingredient purchase', purchases: 'Ingredients' },
    journals: { purchases: { enabled: true, label: 'Ingredients & Supplies' } },
    units: ['plate', 'pcs', 'kgs', 'l', 'bottle', 'room-night', 'other'],
    customerSegments: [
      { value: 'dine_in', label: 'Dine-in' },
      { value: 'takeaway', label: 'Takeaway / delivery' },
      { value: 'event', label: 'Event / catering' },
      { value: 'corporate', label: 'Corporate account' }
    ],
    expenseCategories: ['Cooking gas & charcoal', 'Kitchen supplies', 'Cleaning & laundry'],
    milestoneCategories: ['Health inspection', 'Menu launch', 'Event hosted', 'License renewal'],
    equipmentCategories: ['Kitchen equipment', 'Refrigeration', 'Furniture & seating', 'Bar equipment', 'Power & Backup Energy', 'Other Assets'],
    profileFields: [
      { key: 'seats', label: 'Seats / covers', type: 'number' },
      { key: 'rooms', label: 'Rooms (hotels)', type: 'number' }
    ],
    kpis: [
      { key: 'food_cost', label: 'Food cost %', formula: 'cogs_ratio' },
      { key: 'revenue_per_seat', label: 'Revenue per seat', formula: 'revenue_per_unit', field: 'seats' },
      { key: 'average_sale', label: 'Average bill', formula: 'average_sale' }
    ]
  },
  'Manufacturing & Production': {
    icon: 'factory',
    description: 'Workshops and factories turning raw materials into finished goods.',
    terms: { purchase: 'Raw material purchase', purchases: 'Raw materials' },
    journals: { purchases: { enabled: true, label: 'Raw Materials' } },
    expenseCategories: ['Machine power & fuel', 'Packaging', 'Quality testing'],
    milestoneCategories: ['Production run', 'Certification (RSB)', 'New product line', 'Machine installed'],
    equipmentCategories: ['Production machines', 'Tools', 'Power & Backup Energy', 'Storage', 'Transport', 'Other Assets'],
    profileFields: [
      { key: 'monthlyCapacity', label: 'Monthly production capacity', type: 'text', placeholder: 'e.g. 5,000 bottles' },
      { key: 'certifications', label: 'Certifications', type: 'text', placeholder: 'e.g. RSB S-Mark' }
    ],
    kpis: [
      { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
      { key: 'cogs_ratio', label: 'Production cost %', formula: 'cogs_ratio' },
      { key: 'revenue_per_employee', label: 'Revenue per employee', formula: 'revenue_per_employee' }
    ]
  },
  'Construction & Real Estate': services({
    icon: 'building',
    description: 'Contractors, builders, property developers and rentals.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Service', products: 'Services', sale: 'Invoice', sales: 'Invoices', purchase: 'Materials purchase', purchases: 'Materials' },
    journals: { sales: { enabled: true, label: 'Client Invoices' }, purchases: { enabled: true, label: 'Materials' }, other: { enabled: true, label: 'Projects & Milestones' } },
    units: ['m²', 'meters', 'tons', 'bag', 'day', 'month', 'service', 'other'],
    customerSegments: [
      { value: 'private', label: 'Private client' },
      { value: 'government', label: 'Government tender' },
      { value: 'company', label: 'Company' },
      { value: 'tenant', label: 'Tenant' }
    ],
    expenseCategories: ['Site labour', 'Equipment hire', 'Permits & inspections'],
    milestoneCategories: ['Contract signed', 'Site handover', 'Stage completed', 'Final handover', 'Tender submitted'],
    equipmentCategories: ['Construction machinery', 'Tools', 'Vehicles', 'Scaffolding', 'Other Assets'],
    profileFields: [
      { key: 'activeProjects', label: 'Active projects', type: 'number' },
      { key: 'contractorClass', label: 'Contractor category / license', type: 'text' }
    ],
    kpis: [
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' },
      { key: 'receivables_ratio', label: 'Invoices not paid yet', formula: 'receivables_ratio' },
      { key: 'revenue_per_project', label: 'Revenue per active project', formula: 'revenue_per_unit', field: 'activeProjects' }
    ]
  }),
  'Transport & Logistics': services({
    icon: 'truck',
    description: 'Moto, taxi, bus, trucking, courier and logistics companies.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Trip / service', products: 'Trips & services', sale: 'Trip', sales: 'Trips', purchase: 'Supply purchase', purchases: 'Supplies' },
    journals: { sales: { enabled: true, label: 'Trips & Hires' } },
    units: ['trip', 'km', 'day', 'tons', 'parcel', 'service', 'other'],
    customerSegments: [
      { value: 'individual', label: 'Individual passenger' },
      { value: 'company', label: 'Company contract' },
      { value: 'parcel', label: 'Parcel / courier' }
    ],
    expenseCategories: ['Fuel', 'Vehicle insurance', 'Vehicle repairs & tyres', 'Parking & road fees'],
    milestoneCategories: ['Vehicle added', 'Inspection passed', 'Route launched', 'Contract signed'],
    equipmentCategories: ['Vehicles', 'Motorcycles', 'Trucks & trailers', 'Tracking devices', 'Other Assets'],
    profileFields: [
      { key: 'fleetSize', label: 'Vehicles in fleet', type: 'number' },
      { key: 'routes', label: 'Main routes / areas', type: 'text' }
    ],
    kpis: [
      { key: 'revenue_per_vehicle', label: 'Revenue per vehicle', formula: 'revenue_per_unit', field: 'fleetSize' },
      { key: 'expense_ratio', label: 'Running costs as % of revenue', formula: 'expense_ratio' },
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' }
    ]
  }),
  'Technology & Digital Services': services({
    icon: 'laptop',
    description: 'Software, IT support, digital agencies and online services.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Service', products: 'Services', sale: 'Invoice', sales: 'Invoices' },
    expenseCategories: ['Software subscriptions', 'Hosting & cloud', 'Internet & data'],
    milestoneCategories: ['Product release', 'Client onboarded', 'Contract signed', 'Certification'],
    profileFields: [{ key: 'activeClients', label: 'Active clients', type: 'number' }],
    kpis: [
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' },
      { key: 'revenue_per_employee', label: 'Revenue per employee', formula: 'revenue_per_employee' },
      { key: 'receivables_ratio', label: 'Invoices not paid yet', formula: 'receivables_ratio' }
    ]
  }),
  'Professional Services': services({
    icon: 'briefcase',
    description: 'Consultants, accountants, lawyers, agencies and other advisory firms.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Service', products: 'Services', sale: 'Invoice', sales: 'Invoices' },
    expenseCategories: ['Professional fees & memberships'],
    profileFields: [{ key: 'activeClients', label: 'Active clients', type: 'number' }],
    kpis: [
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' },
      { key: 'revenue_per_employee', label: 'Revenue per employee', formula: 'revenue_per_employee' },
      { key: 'receivables_ratio', label: 'Invoices not paid yet', formula: 'receivables_ratio' }
    ]
  }),
  'Health & Personal Care': services({
    sells: 'mixed',
    tracksStock: true,
    icon: 'heart',
    description: 'Clinics, pharmacies, salons, barbers and spas.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Service / product', products: 'Services & products' },
    journals: { purchases: { enabled: true, label: 'Supplies & Stock' } },
    units: ['service', 'session', 'pcs', 'box', 'bottle', 'other'],
    customerSegments: [
      { value: 'walk_in', label: 'Walk-in client' },
      { value: 'regular', label: 'Regular client' },
      { value: 'insured', label: 'Insured (RSSB / private)' }
    ],
    expenseCategories: ['Medical & beauty supplies', 'Cleaning & sterilisation', 'Staff commissions'],
    milestoneCategories: ['License renewal', 'Inspection', 'New service launched'],
    equipmentCategories: ['Medical / salon equipment', 'Furniture', 'Power & Backup Energy', 'Other Assets'],
    profileFields: [
      { key: 'serviceRooms', label: 'Rooms / chairs', type: 'number' },
      { key: 'licenseNumber', label: 'Professional license number', type: 'text' }
    ],
    kpis: [
      { key: 'gross_margin', label: 'Gross margin', formula: 'gross_margin' },
      { key: 'revenue_per_chair', label: 'Revenue per room / chair', formula: 'revenue_per_unit', field: 'serviceRooms' },
      { key: 'average_sale', label: 'Average visit', formula: 'average_sale' }
    ]
  }),
  'Education & Training': services({
    icon: 'graduation',
    description: 'Schools, nurseries, training centres and tutoring.',
    terms: { customer: 'Student / parent', customers: 'Students', product: 'Course / fee', products: 'Courses & fees', sale: 'Fee payment', sales: 'Fees' },
    journals: { sales: { enabled: true, label: 'Fees & Enrolment' } },
    units: ['term', 'month', 'course', 'session', 'student', 'other'],
    customerSegments: [
      { value: 'day', label: 'Day student' },
      { value: 'boarding', label: 'Boarding student' },
      { value: 'sponsored', label: 'Sponsored / scholarship' },
      { value: 'corporate', label: 'Corporate training' }
    ],
    expenseCategories: ['Teaching materials', 'School feeding', 'Exams & certification'],
    milestoneCategories: ['Term start', 'Exams', 'Graduation', 'Accreditation'],
    equipmentCategories: ['Classroom furniture', 'Computers & lab equipment', 'School transport', 'Other Assets'],
    profileFields: [
      { key: 'students', label: 'Enrolled students', type: 'number' },
      { key: 'classrooms', label: 'Classrooms', type: 'number' }
    ],
    kpis: [
      { key: 'revenue_per_student', label: 'Revenue per student', formula: 'revenue_per_unit', field: 'students' },
      { key: 'receivables_ratio', label: 'Fees not paid yet', formula: 'receivables_ratio' },
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' }
    ]
  }),
  'Tourism & Creative Industries': services({
    sells: 'mixed',
    icon: 'palette',
    description: 'Tour operators, guides, artists, crafts, media and events.',
    terms: { customer: 'Client', customers: 'Clients', product: 'Tour / product', products: 'Tours & products', sale: 'Booking', sales: 'Bookings' },
    journals: { sales: { enabled: true, label: 'Bookings & Sales' } },
    units: ['booking', 'person', 'day', 'pcs', 'service', 'other'],
    customerSegments: [
      { value: 'local', label: 'Local client' },
      { value: 'international', label: 'International visitor' },
      { value: 'agency', label: 'Agency / partner' }
    ],
    expenseCategories: ['Park & entry fees', 'Materials & props', 'Commissions to agents'],
    milestoneCategories: ['Event held', 'Exhibition', 'Partnership signed', 'Season start'],
    kpis: [
      { key: 'net_margin', label: 'Net margin', formula: 'net_margin' },
      { key: 'average_sale', label: 'Average booking', formula: 'average_sale' },
      { key: 'expense_ratio', label: 'Costs as % of revenue', formula: 'expense_ratio' }
    ]
  }),
  'Other Services': services({
    sells: 'mixed',
    tracksStock: true,
    icon: 'grid',
    description: 'Any other kind of business.'
  })
};

const isPlainObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep merge where arrays are replaced, not concatenated. */
export const mergeTemplate = (base, override) => {
  if (!isPlainObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined || value === null) continue;
    out[key] = isPlainObject(value) && isPlainObject(base[key]) ? mergeTemplate(base[key], value) : value;
  }
  return out;
};

const findDefault = (businessType) => {
  const key = Object.keys(DEFAULT_TEMPLATES).find((k) => k.toLowerCase() === String(businessType || '').trim().toLowerCase());
  return key ? DEFAULT_TEMPLATES[key] : null;
};

/** Full template for a category: base ← built-in default for the type ← stored config. */
export const resolveTemplate = (businessType, storedConfig) =>
  mergeTemplate(mergeTemplate(BASE_TEMPLATE, findDefault(businessType) || {}), storedConfig || {});

/** Validates an admin-submitted config; throws a readable message on problems. */
export const validateTemplateConfig = (config) => {
  if (config === undefined || config === null) return null;
  if (!isPlainObject(config)) throw new Error('Template config must be an object');
  const str = (v) => typeof v === 'string';
  const strArray = (v) => Array.isArray(v) && v.every(str);
  if (config.sells && !['goods', 'services', 'mixed'].includes(config.sells)) throw new Error('sells must be goods, services or mixed');
  for (const key of ['units', 'expenseCategories', 'milestoneCategories', 'equipmentCategories']) {
    if (config[key] !== undefined && !strArray(config[key])) throw new Error(`${key} must be a list of text values`);
  }
  if (config.terms !== undefined) {
    if (!isPlainObject(config.terms) || !Object.values(config.terms).every(str)) throw new Error('terms must map words to text');
  }
  if (config.customerSegments !== undefined) {
    if (!Array.isArray(config.customerSegments) || !config.customerSegments.every((s) => isPlainObject(s) && str(s.value) && str(s.label))) {
      throw new Error('customerSegments must be a list of { value, label }');
    }
  }
  if (config.profileFields !== undefined) {
    if (!Array.isArray(config.profileFields) || !config.profileFields.every((f) => isPlainObject(f) && str(f.key) && str(f.label) && ['text', 'number'].includes(f.type))) {
      throw new Error('profileFields must be a list of { key, label, type: text|number }');
    }
  }
  if (config.kpis !== undefined) {
    if (!Array.isArray(config.kpis) || !config.kpis.every((k) => isPlainObject(k) && str(k.key) && str(k.label) && KPI_FORMULAS.includes(k.formula))) {
      throw new Error(`kpis must be a list of { key, label, formula } with formula one of: ${KPI_FORMULAS.join(', ')}`);
    }
  }
  if (config.journals !== undefined) {
    if (!isPlainObject(config.journals)) throw new Error('journals must be an object');
    for (const [k, v] of Object.entries(config.journals)) {
      if (!['sales', 'purchases', 'cash_in', 'cash_out', 'other'].includes(k)) throw new Error(`Unknown journal "${k}"`);
      if (!isPlainObject(v)) throw new Error(`journals.${k} must be { enabled, label }`);
    }
  }
  if (JSON.stringify(config).length > 20000) throw new Error('Template config is too large');
  return config;
};
