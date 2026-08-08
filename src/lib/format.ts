import { formatEther } from "viem";

export function formatGen(wei: bigint, maxDecimals = 4): string {
  const value = Number(formatEther(wei));
  return `${value.toLocaleString(undefined, { maximumFractionDigits: maxDecimals })} GEN`;
}

export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function yesProbability(yesPool: bigint, noPool: bigint): number {
  const total = yesPool + noPool;
  if (total === 0n) return 50;
  return Number((yesPool * 10000n) / total) / 100;
}

export function formatExpiry(expiryUnix: number): string {
  const now = Date.now() / 1000;
  const diff = expiryUnix - now;
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function relativeTime(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
