export type MarketCategory = 'news' | 'sports' | 'crypto' | 'weather';
export type MarketStatus = 'open' | 'resolving' | 'disputed' | 'finalized';

export interface Market {
  id: string;
  question: string;
  category: MarketCategory;
  status: MarketStatus;
  resolution_criteria: string;
  expiry: string; // ISO date
  yes_probability: number;
  api_source: string;
  created_at: string;
  creator_address?: string;
}

export interface Resolution {
  id: string;
  market_id: string;
  outcome: 'YES' | 'NO';
  confidence: number;
  reasoning_steps: string[];
  data_hash: string;
  prompt_version: string;
  model_id: string;
  resolved_at: string;
}

export interface Dispute {
  id: string;
  market_id: string;
  disputer_address: string;
  evidence: Record<string, unknown>;
  evidence_hash: string;
  created_at: string;
}

export interface Arbitration {
  id: string;
  market_id: string;
  dispute_id: string;
  outcome: 'YES' | 'NO';
  confidence: number;
  reasoning_steps: string[];
  data_hash: string;
  finalized_at: string;
}
