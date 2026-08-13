import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import * as veriMarket from "@/integrations/genlayer/contract";
import type { MarketCategory } from "@/integrations/genlayer/types";
import { useToast } from "@/components/toast";
import { explorerTxUrl } from "@/lib/explorer";

const POLL_INTERVAL_MS = 15000;

export function useMarkets() {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["markets", network],
    queryFn: () => veriMarket.getAllMarkets(network),
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useMarket(id: number | undefined) {
  const { network } = useWallet();
  return useQuery({
    queryKey: ["market", network, id],
    queryFn: () => veriMarket.getMarket(network, id as number),
    enabled: id !== undefined,
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useCreateMarket() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (params: {
      question: string;
      category: MarketCategory;
      sourceQuery: string;
      resolutionCriteria: string;
      expiry: number;
      bondGen: string;
    }) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.createMarket(network, address, { ...params, bondWei: parseEther(params.bondGen) });
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["markets", network] });
      toast({
        title: "Market created",
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Failed to create market", description: err.message, tone: "error" }),
  });
}

export function usePlaceTrade() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (params: { marketId: number; position: "yes" | "no"; amountGen: string }) => {
      if (!address) throw new Error("Connect a wallet first");
      const amountWei = parseEther(params.amountGen);
      return veriMarket.placeTrade(network, address, params.marketId, params.position, amountWei);
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["markets", network] });
      queryClient.invalidateQueries({ queryKey: ["market", network, variables.marketId] });
      queryClient.invalidateQueries({ queryKey: ["marketTrades", network, variables.marketId] });
      toast({
        title: `${variables.position.toUpperCase()} position placed`,
        description: `${variables.amountGen} GEN`,
        tone: "success",
        action: { label: "View transaction", href: explorerTxUrl(network, result.hash) },
      });
    },
    onError: (err) => toast({ title: "Trade failed", description: err.message, tone: "error" }),
  });
}

export function usePinMarket() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (params: { marketId: number; pinned: boolean }) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.pinMarket(network, address, params.marketId, params.pinned);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["markets", network] });
      toast({ title: variables.pinned ? "Market pinned" : "Market unpinned", tone: "success" });
    },
    onError: (err) => toast({ title: "Action failed", description: err.message, tone: "error" }),
  });
}

export function useHideMarket() {
  const { network, address } = useWallet();
  const queryClient = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: async (params: { marketId: number; hidden: boolean }) => {
      if (!address) throw new Error("Connect a wallet first");
      return veriMarket.hideMarket(network, address, params.marketId, params.hidden);
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["markets", network] });
      toast({ title: variables.hidden ? "Market hidden" : "Market unhidden", tone: "success" });
    },
    onError: (err) => toast({ title: "Action failed", description: err.message, tone: "error" }),
  });
}
