import { createClient } from "genlayer-js";
import { studionet, testnetAsimov } from "genlayer-js/chains";
import type { Address } from "genlayer-js/types";

export type NetworkKey = "studionet" | "testnetAsimov";

export const NETWORKS: Record<NetworkKey, { chain: typeof studionet; label: string; explorer: string }> = {
  studionet: { chain: studionet, label: "Studionet", explorer: "https://explorer-studio.genlayer.com" },
  testnetAsimov: { chain: testnetAsimov, label: "Testnet Asimov", explorer: "https://explorer-asimov.genlayer.com" },
};

// Set once each network's VeriMarket contract is deployed (see contracts/deployments/*.json).
export const CONTRACT_ADDRESSES: Record<NetworkKey, Address | null> = {
  studionet: "0x284a0C90CD7A3A7586522C0eEB1B752EbD2Ee797",
  testnetAsimov: "0x42919CA9E6DEC6d68D41F032000A26fc598faBD2",
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

function getEthereumProvider() {
  return typeof window !== "undefined" ? (window as unknown as { ethereum?: unknown }).ethereum : undefined;
}

export function createGenLayerClient(network: NetworkKey, account?: Address) {
  return createClient({
    chain: NETWORKS[network].chain,
    account,
    provider: getEthereumProvider() as never,
  });
}

export async function connectWallet(): Promise<Address> {
  const ethereum = getEthereumProvider() as { request: (args: { method: string }) => Promise<string[]> } | undefined;
  if (!ethereum) {
    throw new Error("No wallet found. Install MetaMask (or a compatible wallet) to continue.");
  }
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  if (!accounts?.[0]) {
    throw new Error("No account returned by wallet");
  }
  return accounts[0] as Address;
}

export async function switchToNetwork(network: NetworkKey): Promise<void> {
  const client = createGenLayerClient(network);
  await client.connect(network);
}
