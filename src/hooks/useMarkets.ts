import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { demoMarkets } from '@/data/demo-markets';

export interface DBMarket {
  id: string;
  question: string;
  category: string;
  status: string;
  resolution_criteria: string;
  expiry: string;
  yes_probability: number;
  api_source: string;
  created_at: string;
  updated_at: string;
  creator_address?: string | null;
  pinned: boolean;
  volume: number;
}

export function useMarkets() {
  const queryClient = useQueryClient();

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('markets-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'markets' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['markets'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ['markets'],
    queryFn: async (): Promise<DBMarket[]> => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('DB fetch failed, using demo data:', error);
        return demoMarkets.map(m => ({
          ...m,
          updated_at: m.created_at,
          pinned: false,
          volume: Math.random() * 50000,
        }));
      }

      if (!data || data.length === 0) {
        return demoMarkets.map(m => ({
          ...m,
          updated_at: m.created_at,
          pinned: false,
          volume: Math.random() * 50000,
        }));
      }

      return data as DBMarket[];
    },
  });
}

export function useMarket(id: string) {
  return useQuery({
    queryKey: ['market', id],
    queryFn: async (): Promise<DBMarket | null> => {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Try demo data
        const demo = demoMarkets.find(m => m.id === id);
        if (demo) return { ...demo, updated_at: demo.created_at, pinned: false, volume: Math.random() * 50000 };
        return null;
      }
      return data as DBMarket;
    },
  });
}

export function useCreateMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (market: {
      question: string;
      category: string;
      resolution_criteria: string;
      expiry: string;
      api_source: string;
      creator_address?: string;
    }) => {
      const { data, error } = await supabase
        .from('markets')
        .insert({
          question: market.question,
          category: market.category as any,
          resolution_criteria: market.resolution_criteria,
          expiry: market.expiry,
          api_source: market.api_source,
          creator_address: market.creator_address,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  });
}

export function usePlaceTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trade: {
      market_id: string;
      trader_address: string;
      position: 'YES' | 'NO';
      amount: number;
      estimated_payout: number;
    }) => {
      const { data, error } = await supabase
        .from('trades')
        .insert(trade)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['markets'] }),
  });
}
