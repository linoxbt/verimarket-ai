import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";

const POLL_INTERVAL_MS = 15000;

export function useResolution(marketId: number | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["resolution", network, marketId],
    queryFn: () => veriMarket.getResolution(network, marketId as number),
    enabled: marketId !== undefined,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useDispute(marketId: number | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["dispute", network, marketId],
    queryFn: () => veriMarket.getDispute(network, marketId as number),
    enabled: marketId !== undefined,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useArbitration(marketId: number | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["arbitration", network, marketId],
    queryFn: () => veriMarket.getArbitration(network, marketId as number),
    enabled: marketId !== undefined,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

function invalidateMarket(queryClient: ReturnType<typeof useQueryClient>, network: string, marketId: number) {
  queryClient.invalidateQueries({ queryKey: ["market", network, marketId] });
  queryClient.invalidateQueries({ queryKey: ["markets", network] });
  queryClient.invalidateQueries({ queryKey: ["resolution", network, marketId] });
  queryClient.invalidateQueries({ queryKey: ["dispute", network, marketId] });
  queryClient.invalidateQueries({ queryKey: ["arbitration", network, marketId] });
}

export function useResolveMarket() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.resolveMarket(network, address, marketId);
    },
    onSuccess: (_data, marketId) => invalidateMarket(queryClient, network, marketId),
  });
}

export function useFileDispute() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { marketId: number; evidence: string; bondGen: string }) => {
      if (!address) throw new Error("Connect a wallet first");
      const bondWei = parseEther(params.bondGen);
      return veriMarket.fileDispute(network, address, params.marketId, params.evidence, bondWei);
    },
    onSuccess: (_data, variables) => invalidateMarket(queryClient, network, variables.marketId),
  });
}

export function useArbitrate() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.arbitrate(network, address, marketId);
    },
    onSuccess: (_data, marketId) => invalidateMarket(queryClient, network, marketId),
  });
}

export function useClaimPayout() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.claimPayout(network, address, marketId);
    },
    onSuccess: (_data, marketId) => invalidateMarket(queryClient, network, marketId),
  });
}
