
export enum AgentRole {
  MD = 'Managing Director',
  VP = 'Vice President',
  ASSOCIATE = 'Associate',
  SCOUT = 'Scout Agent',
  COMPS = 'Comps Agent',
  DILIGENCE = 'Diligence Agent',
  DESIGN = 'Design Director'
}

export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  WORKING = 'working',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface Agent {
  id: string;
  role: AgentRole;
  name: string;
  status: AgentStatus;
  currentTask?: string;
  description: string;
}

export interface AppError {
  message: string;
  stack?: string;
  code?: string;
  context?: string;
}

export interface LogEntry {
  id: string;
  traceId?: string;
  timestamp: Date;
  agentName: string;
  role: AgentRole;
  message: string;
  status: AgentStatus;
  latency?: number; // in milliseconds
  errorDetails?: AppError;
}

export interface FileAttachment {
  name: string;
  type: string; // MIME type
  data: string; // Base64 Data URI
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  sender?: string; 
  inputAttachments?: FileAttachment[]; // Files uploaded by user
  attachments?: { // Generated outputs
    type: 'image' | 'chart' | 'file';
    url?: string;
    data?: any;
    title?: string;
  }[];
  suggestedActions?: string[]; // New: Contextual follow-up suggestions
}

export interface SensitivityRow {
  entryMultiple: number;
  exits: { multiple: number; irr: number }[];
}

export interface InvestmentMemo {
  executiveSummary: string; // Concise & Impactful
  investmentRecommendation: "GO" | "NO-GO" | "HOLD";
  recommendationRationale: string;
  
  dealMerits: string[];
  investmentThesis: string[];
  
  keyRisks: string[]; // High level
  riskMitigation: string; // Detailed analysis of risks and how to mitigate them
  
  marketOverview: string;
  competitiveLandscape: string; // Competitors, market share, moat
  customerAnalysis: string; // Concentration, retention, churn
  
  operationalUpside: string;
}

// --- Financial Modeling Types ---

export interface FinancialRow {
  label: string;
  values: number[]; // [LTM, Year 1, Year 2, Year 3, Year 4, Year 5]
}

export interface FinancialSection {
  title: string;
  rows: FinancialRow[];
}

export interface LBODetailed {
    assumptions: { label: string; value: string }[];
    sources: { label: string; value: number }[];
    uses: { label: string; value: number }[];
    debtSchedule: FinancialSection;
    projectedReturns: FinancialSection;
}

// --- Deliverable Types ---
export type DeliverableType = 'Teaser' | 'Pitch Deck' | 'CIM' | 'One Pager';

export interface Slide {
  title: string;
  contentPoints: string[];
  visualDirective: string; // Instructions for the image generator
  imageUrl?: string; // The generated base64 image
}

export interface Deliverable {
  id: string;
  type: DeliverableType;
  title: string;
  status: 'drafting' | 'rendering' | 'completed';
  slides: Slide[];
  createdAt: Date;
}

// --- Portfolio Types ---
export interface PortfolioCompany {
  id: string;
  name: string;
  sector: string;
  location?: string;
  entryDate?: string; // YYYY-MM-DD or Year
  investmentStatus: 'Active' | 'Exited' | 'Watchlist';
  
  // Financials
  revenue: number; // LTM
  ebitda: number; // LTM
  grossMargin?: number;
  
  description?: string;
}

export interface DealData {
  companyName: string;
  sector: string;
  location?: string;
  // Financials High Level
  ebitda: number;
  revenue: number;
  askingMultiple: number;
  impliedValue: number;
  
  // Detailed Models
  financialModels?: {
    years: string[]; // e.g., ["LTM", "2024E", "2025E"...]
    incomeStatement: FinancialSection;
    balanceSheet: FinancialSection;
    cashFlow: FinancialSection;
  };

  // Valuation
  lboModel: {
    entryMultiple: number;
    exitMultiple: number;
    irr: number;
    moic: number;
    debttoEquity: number;
  };
  lboDetailed?: LBODetailed;
  
  sensitivityAnalysis?: SensitivityRow[]; 
  comparables?: { name: string; multiple: number }[];
  
  // Content
  memo: InvestmentMemo;
  groundingUrls?: string[];
  candidatesAnalyzed?: string[]; 
  
  // Generated Assets
  deliverables?: Deliverable[];

  // Context
  portfolioContext?: PortfolioCompany[]; // List of portcos for benchmarking
}
