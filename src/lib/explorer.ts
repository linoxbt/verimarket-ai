import { NETWORKS, type NetworkKey } from "@/integrations/genlayer/client";

export function explorerAddressUrl(network: NetworkKey, address: string): string {
  return `${NETWORKS[network].explorer}/address/${address}`;
}

export function explorerTxUrl(network: NetworkKey, hash: string): string {
  return `${NETWORKS[network].explorer}/tx/${hash}`;
}
