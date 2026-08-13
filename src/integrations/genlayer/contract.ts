import type { Address } from "genlayer-js/types";
import { createGenLayerClient, getContractAddress, type NetworkKey } from "./client";
import type { Arbitration, Dispute, Market, MarketCategory, Position, Resolution, Trade } from "./types";

function toMarket(raw: Record<string, unknown>): Market {
  return {
    id: Number(raw.id),
    question: String(raw.question),
    category: raw.category as MarketCategory,
    source_query: String(raw.source_query),
    resolution_criteria: String(raw.resolution_criteria),
    expiry: Number(raw.expiry),
    creator: String(raw.creator),
    status: raw.status as Market["status"],
    yes_pool: BigInt(raw.yes_pool as bigint | number),
    no_pool: BigInt(raw.no_pool as bigint | number),
    pinned: Boolean(raw.pinned),
    hidden: Boolean(raw.hidden),
  };
}

function toResolution(raw: Record<string, unknown>): Resolution {
  return {
    market_id: Number(raw.market_id),
    outcome: raw.outcome as Position,
    confidence: Number(raw.confidence),
    reasoning: String(raw.reasoning),
    evidence_summary: String(raw.evidence_summary),
    data_hash: String(raw.data_hash),
    resolved_at: Number(raw.resolved_at),
    dispute_deadline: Number(raw.dispute_deadline),
  };
}

function toDispute(raw: Record<string, unknown>): Dispute {
  return {
    market_id: Number(raw.market_id),
    disputer: String(raw.disputer),
    evidence: String(raw.evidence),
    bond_amount: BigInt(raw.bond_amount as bigint | number),
    filed_at: Number(raw.filed_at),
  };
}

function toArbitration(raw: Record<string, unknown>): Arbitration {
  return {
    market_id: Number(raw.market_id),
    outcome: raw.outcome as Position,
    confidence: Number(raw.confidence),
    reasoning: String(raw.reasoning),
    finalized_at: Number(raw.finalized_at),
  };
}

function toTrade(raw: Record<string, unknown>): Trade {
  return {
    market_id: Number(raw.market_id),
    trader: String(raw.trader),
    position: raw.position as Position,
    amount: BigInt(raw.amount as bigint | number),
    timestamp: Number(raw.timestamp),
  };
}

export async function getAllMarkets(network: NetworkKey): Promise<Market[]> {
  const client = createGenLayerClient(network);
  const result = (await client.readContract({
    address: getContractAddress(network),
    functionName: "get_all_markets",
    args: [],
  })) as Record<string, unknown>[];
  return result.map(toMarket);
}

export async function getMarket(network: NetworkKey, marketId: number): Promise<Market> {
  const client = createGenLayerClient(network);
  const result = await client.readContract({
    address: getContractAddress(network),
    functionName: "get_market",
    args: [marketId],
  });
  return toMarket(result as Record<string, unknown>);
}

export async function getResolution(network: NetworkKey, marketId: number): Promise<Resolution | null> {
  const client = createGenLayerClient(network);
  try {
    const result = await client.readContract({
      address: getContractAddress(network),
      functionName: "get_resolution",
      args: [marketId],
    });
    return toResolution(result as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getDispute(network: NetworkKey, marketId: number): Promise<Dispute | null> {
  const client = createGenLayerClient(network);
  try {
    const result = await client.readContract({
      address: getContractAddress(network),
      functionName: "get_dispute",
      args: [marketId],
    });
    return toDispute(result as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getArbitration(network: NetworkKey, marketId: number): Promise<Arbitration | null> {
  const client = createGenLayerClient(network);
  try {
    const result = await client.readContract({
      address: getContractAddress(network),
      functionName: "get_arbitration",
      args: [marketId],
    });
    return toArbitration(result as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function getMarketTrades(network: NetworkKey, marketId: number): Promise<Trade[]> {
  const client = createGenLayerClient(network);
  const result = (await client.readContract({
    address: getContractAddress(network),
    functionName: "get_market_trades",
    args: [marketId],
  })) as Record<string, unknown>[];
  return result.map(toTrade);
}

export async function getUserTrades(network: NetworkKey, address: string): Promise<Trade[]> {
  const client = createGenLayerClient(network);
  const result = (await client.readContract({
    address: getContractAddress(network),
    functionName: "get_user_trades",
    args: [address],
  })) as Record<string, unknown>[];
  return result.map(toTrade);
}

export async function getOwner(network: NetworkKey): Promise<string> {
  const client = createGenLayerClient(network);
  const result = await client.readContract({
    address: getContractAddress(network),
    functionName: "owner_address",
    args: [],
  });
  return String(result);
}

export async function getAdmins(network: NetworkKey): Promise<string[]> {
  const client = createGenLayerClient(network);
  const result = (await client.readContract({
    address: getContractAddress(network),
    functionName: "get_admins",
    args: [],
  })) as unknown[];
  return result.map(String);
}

async function writeAndWait(
  network: NetworkKey,
  account: Address,
  functionName: string,
  args: unknown[],
  value = 0n,
) {
  const client = createGenLayerClient(network, account);
  const txHash = await client.writeContract({
    address: getContractAddress(network),
    functionName,
    args: args as never[],
    value,
  });
  const receipt = await client.waitForTransactionReceipt({ hash: txHash, interval: 4000, retries: 40 });
  return { hash: txHash as string, receipt };
}

export async function getBalance(network: NetworkKey, address: Address): Promise<bigint> {
  const client = createGenLayerClient(network);
  return client.getBalance({ address });
}

export async function createMarket(
  network: NetworkKey,
  account: Address,
  params: {
    question: string;
    category: MarketCategory;
    sourceQuery: string;
    resolutionCriteria: string;
    expiry: number;
    bondWei: bigint;
  },
) {
  return writeAndWait(
    network,
    account,
    "create_market",
    [params.question, params.category, params.sourceQuery, params.resolutionCriteria, params.expiry],
    params.bondWei,
  );
}

export async function placeTrade(
  network: NetworkKey,
  account: Address,
  marketId: number,
  position: Position,
  amountWei: bigint,
) {
  return writeAndWait(network, account, "place_trade", [marketId, position], amountWei);
}

export async function resolveMarket(network: NetworkKey, account: Address, marketId: number) {
  return writeAndWait(network, account, "resolve_market", [marketId]);
}

export async function fileDispute(
  network: NetworkKey,
  account: Address,
  marketId: number,
  evidence: string,
  bondWei: bigint,
) {
  return writeAndWait(network, account, "file_dispute", [marketId, evidence], bondWei);
}

export async function arbitrate(network: NetworkKey, account: Address, marketId: number) {
  return writeAndWait(network, account, "arbitrate", [marketId]);
}

export async function claimPayout(network: NetworkKey, account: Address, marketId: number) {
  return writeAndWait(network, account, "claim_payout", [marketId]);
}

export async function pinMarket(network: NetworkKey, account: Address, marketId: number, pinned: boolean) {
  return writeAndWait(network, account, "pin_market", [marketId, pinned]);
}

export async function hideMarket(network: NetworkKey, account: Address, marketId: number, hidden: boolean) {
  return writeAndWait(network, account, "hide_market", [marketId, hidden]);
}
