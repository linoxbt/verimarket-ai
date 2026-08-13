import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";
import { useToast } from "@/components/toast";
import { explorerTxUrl } from "@/lib/explorer";

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
  const toast = useToast();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.resolveMarket(network, address, marketId);
    },
    onSuccess: (result, marketId) => {
      invalidateMarket(queryClient, network, marketId);
      toast({
        title: "Market resolved",
        description: "AI leader/validator consensus reached — see the outcome below.",
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Resolution failed", description: err.message, tone: "error" }),
  });
}

export function useFileDispute() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (params: { marketId: number; evidence: string; bondGen: string }) => {
      if (!address) throw new Error("Connect a wallet first");
      const bondWei = parseEther(params.bondGen);
      return veriMarket.fileDispute(network, address, params.marketId, params.evidence, bondWei);
    },
    onSuccess: (result, variables) => {
      invalidateMarket(queryClient, network, variables.marketId);
      toast({
        title: "Dispute filed",
        description: `Bond: ${variables.bondGen} GEN`,
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Failed to file dispute", description: err.message, tone: "error" }),
  });
}

export function useArbitrate() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.arbitrate(network, address, marketId);
    },
    onSuccess: (result, marketId) => {
      invalidateMarket(queryClient, network, marketId);
      toast({
        title: "Arbitration finalized",
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Arbitration failed", description: err.message, tone: "error" }),
  });
}

export function useClaimPayout() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (marketId: number) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.claimPayout(network, address, marketId);
    },
    onSuccess: (result, marketId) => {
      invalidateMarket(queryClient, network, marketId);
      toast({
        title: "Payout claimed",
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Claim failed", description: err.message, tone: "error" }),
  });
}
