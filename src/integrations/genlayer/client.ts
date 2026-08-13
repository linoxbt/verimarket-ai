import { createClient } from "genlayer-js";
import { studionet, testnetAsimov } from "genlayer-js/chains";
import type { Address } from "genlayer-js/types";

export type NetworkKey = "studionet" | "testnetAsimov";

export const NETWORKS: Record<NetworkKey, { chain: typeof studionet; label: string; explorer: string }> = {
  studionet: { chain: studionet, label: "Studionet", explorer: "https://explorer-studio.genlayer.com" },
  testnetAsimov: { chain: testnetAsimov, label: "Testnet Asimov", explorer: "https://explorer-asimov.genlayer.com" },
};

export const NETWORK_BY_CHAIN_ID: Record<number, NetworkKey> = {
  [studionet.id]: "studionet",
  [testnetAsimov.id]: "testnetAsimov",
};

// Set once each network's VeriMarket contract is deployed (see contracts/deployments/*.json).
export const CONTRACT_ADDRESSES: Record<NetworkKey, Address | null> = {
  studionet: "0xF31A718EA84e7513821BD018863E73784e6373d2",
  testnetAsimov: "0xa9D38077aA11707faB8D98c7333f4037C84575fa",
};

const DEFAULT_NETWORK: NetworkKey = "studionet";
const STORAGE_KEY = "verimarket:network";

export function getStoredNetwork(): NetworkKey {
  if (typeof window === "undefined") return DEFAULT_NETWORK;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "studionet" || stored === "testnetAsimov" ? stored : DEFAULT_NETWORK;
}

export function setStoredNetwork(network: NetworkKey) {
  window.localStorage.setItem(STORAGE_KEY, network);
}

export function getContractAddress(network: NetworkKey): Address {
  const address = CONTRACT_ADDRESSES[network];
  if (!address) {
    throw new Error(`VeriMarket is not deployed on ${NETWORKS[network].label} yet`);
  }
  return address;
}

// Set by WalletProvider whenever the connected wagmi/Reown connector changes, so
// createGenLayerClient can sign through whatever wallet (injected or WalletConnect) is
// actually connected without every call site needing to thread the provider through.
let activeProvider: unknown = null;

export function setActiveProvider(provider: unknown) {
  activeProvider = provider;
}

export function createGenLayerClient(network: NetworkKey, account?: Address) {
  return createClient({
    chain: NETWORKS[network].chain,
    account,
    provider: activeProvider as never,
  });
}
