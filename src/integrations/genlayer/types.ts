export type MarketCategory = "crypto" | "sports" | "news" | "weather";
export type MarketStatus = "open" | "resolving" | "disputed" | "finalized";
export type Position = "yes" | "no";

export interface Market {
  id: number;
  question: string;
  category: MarketCategory;
  source_query: string;
  resolution_criteria: string;
  expiry: number;
  creator: string;
  status: MarketStatus;
  yes_pool: bigint;
  no_pool: bigint;
  pinned: boolean;
  hidden: boolean;
}

export interface Resolution {
  market_id: number;
  outcome: Position;
  confidence: number;
  reasoning: string;
  evidence_summary: string;
  data_hash: string;
  resolved_at: number;
  dispute_deadline: number;
}

export interface Dispute {
  market_id: number;
  disputer: string;
  evidence: string;
  bond_amount: bigint;
  filed_at: number;
}

export interface Arbitration {
  market_id: number;
  outcome: Position;
  confidence: number;
  reasoning: string;
  finalized_at: number;
}

export interface Trade {
  market_id: number;
  trader: string;
  position: Position;
  amount: bigint;
  timestamp: number;
}

export const CATEGORIES: MarketCategory[] = ["crypto", "sports", "news", "weather"];
