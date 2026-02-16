import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DBTrade {
  id: string;
  market_id: string;
  trader_address: string;
  position: string;
  amount: number;
  estimated_payout: number;
  created_at: string;
}

export function useMarketTrades(marketId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!marketId) return;
    const channel = supabase
      .channel(`trades-${marketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'trades', filter: `market_id=eq.${marketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trades', marketId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [marketId, queryClient]);

  return useQuery({
    queryKey: ['trades', marketId],
    queryFn: async (): Promise<DBTrade[]> => {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as DBTrade[];
    },
    enabled: !!marketId,
  });
}

export function useUserTrades(traderAddress: string) {
  return useQuery({
    queryKey: ['user-trades', traderAddress],
    queryFn: async (): Promise<(DBTrade & { market_question?: string; market_status?: string })[]> => {
      const { data, error } = await supabase
        .from('trades')
        .select('*, markets(question, status)')
        .eq('trader_address', traderAddress)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        market_question: t.markets?.question,
        market_status: t.markets?.status,
      }));
    },
    enabled: !!traderAddress,
  });
}
