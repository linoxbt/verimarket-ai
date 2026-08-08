import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";

const POLL_INTERVAL_MS = 10000;

export function useMarketTrades(marketId: number | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["marketTrades", network, marketId],
    queryFn: () => veriMarket.getMarketTrades(network, marketId as number),
    enabled: marketId !== undefined,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useUserTrades(address: string | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["userTrades", network, address],
    queryFn: () => veriMarket.getUserTrades(network, address as string),
    enabled: !!address,
    refetchInterval: POLL_INTERVAL_MS,
  });
}
