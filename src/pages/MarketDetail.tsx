import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { demoMarkets } from '@/data/demo-markets';
import { useMarket } from '@/hooks/useMarkets';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Clock, Shield, AlertTriangle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import TradeActivityFeed from '@/components/TradeActivityFeed';

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m`;
}

const statusColors: Record<string, string> = {
  open: 'bg-success/20 text-success border-success/30',
  resolving: 'bg-warning/20 text-warning border-warning/30',
  disputed: 'bg-destructive/20 text-destructive border-destructive/30',
  finalized: 'bg-muted text-muted-foreground border-border',
};

const MarketDetail = () => {
  const { id } = useParams();
  const { data: dbMarket } = useMarket(id || '');
  const queryClient = useQueryClient();

  // Realtime subscription for live probability updates
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`market-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'markets', filter: `id=eq.${id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['market', id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, queryClient]);
  
  // Fall back to demo data
  const market = dbMarket || demoMarkets.find((m) => m.id === id);

  const [selectedPosition, setSelectedPosition] = useState<'YES' | 'NO' | null>(null);
  const [amount, setAmount] = useState('');

  const yesPercent = market ? Math.round(market.yes_probability * 100) : 50;
  const noPercent = 100 - yesPercent;

  const estimatedPayout = useMemo(() => {
    if (!amount || !selectedPosition || !market) return 0;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return 0;
    const prob = selectedPosition === 'YES' ? market.yes_probability : 1 - market.yes_probability;
    // Payout = amount / probability (simplified AMM)
    return prob > 0 ? amt / prob : 0;
  }, [amount, selectedPosition, market]);

  const profit = estimatedPayout - parseFloat(amount || '0');

  if (!market) {
    return (
      <main className="container py-8 text-center">
        <p className="text-muted-foreground">Market not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/markets"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
      </main>
    );
  }

  const handleTrade = () => {
    if (!selectedPosition || !amount || parseFloat(amount) <= 0) {
      toast.error('Select a position and enter an amount');
      return;
    }
    toast.success(`Trade placed: ${selectedPosition} for $${amount} (Demo — estimated payout: $${estimatedPayout.toFixed(2)})`);
    setSelectedPosition(null);
    setAmount('');
  };

  return (
    <main className="container max-w-3xl py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/markets"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Markets</Link>
      </Button>

      <div className="space-y-6">
        {/* Title & status */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className={`text-xs ${statusColors[market.status]}`}>
              {market.status}
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{market.category}</span>
          </div>
          <h1 className="text-2xl font-bold">{market.question}</h1>
        </div>

        {/* Countdown & probability */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-foreground">{timeUntil(market.expiry)}</span>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Current Probability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div>
                  <span className="text-2xl font-bold text-success">{yesPercent}%</span>
                  <span className="text-sm text-muted-foreground ml-1">YES</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-destructive">{noPercent}%</span>
                  <span className="text-sm text-muted-foreground ml-1">NO</span>
                </div>
              </div>
              <div className="mt-3 h-3 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-glow-blue to-glow-purple"
                  style={{ width: `${yesPercent}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading interface — Polymarket style */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Trade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Position selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedPosition('YES')}
                className={`flex flex-col items-center justify-center rounded-lg border-2 px-4 py-4 transition-all ${
                  selectedPosition === 'YES'
                    ? 'border-success bg-success/10'
                    : 'border-border hover:border-success/40 hover:bg-success/5'
                }`}
                disabled={market.status !== 'open'}
              >
                <span className="text-lg font-bold text-success">Yes {yesPercent}¢</span>
                <span className="text-xs text-muted-foreground mt-1">Payout $1.00 if Yes</span>
              </button>
              <button
                onClick={() => setSelectedPosition('NO')}
                className={`flex flex-col items-center justify-center rounded-lg border-2 px-4 py-4 transition-all ${
                  selectedPosition === 'NO'
                    ? 'border-destructive bg-destructive/10'
                    : 'border-border hover:border-destructive/40 hover:bg-destructive/5'
                }`}
                disabled={market.status !== 'open'}
              >
                <span className="text-lg font-bold text-destructive">No {noPercent}¢</span>
                <span className="text-xs text-muted-foreground mt-1">Payout $1.00 if No</span>
              </button>
            </div>

            {/* Amount input */}
            {selectedPosition && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Amount ($)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-secondary text-lg"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Estimated returns */}
                {parseFloat(amount) > 0 && (
                  <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg price</span>
                      <span className="text-foreground">
                        {selectedPosition === 'YES' ? yesPercent : noPercent}¢
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shares</span>
                      <span className="text-foreground">
                        {estimatedPayout.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Potential return</span>
                      <span className="text-success font-semibold">
                        ${estimatedPayout.toFixed(2)} ({profit > 0 ? '+' : ''}{((profit / parseFloat(amount)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className={`w-full ${
                    selectedPosition === 'YES'
                      ? 'bg-success hover:bg-success/90 text-success-foreground'
                      : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  }`}
                  onClick={handleTrade}
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  Buy {selectedPosition} — ${amount || '0.00'}
                </Button>
              </div>
            )}

            {market.status !== 'open' && (
              <p className="text-xs text-muted-foreground text-center">Trading is closed for this market</p>
            )}
          </CardContent>
        </Card>

        {/* Resolution criteria */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Resolution Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{market.resolution_criteria}</p>
            <div className="mt-3 text-xs text-muted-foreground">
              <span>Data source: <strong className="text-foreground">{market.api_source}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Trade Activity Feed */}
        <TradeActivityFeed marketId={id || ''} />

        {/* Dispute button */}
        {(market.status === 'resolving' || market.status === 'disputed') && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">Dispute window is active</span>
              </div>
              <Button variant="destructive" size="sm">
                File Dispute
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
};

export default MarketDetail;
