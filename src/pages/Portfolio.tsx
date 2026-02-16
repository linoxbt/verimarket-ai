import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useUserTrades } from '@/hooks/useTrades';
import { useMarkets } from '@/hooks/useMarkets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, TrendingUp, BarChart3, ArrowRight } from 'lucide-react';

const Portfolio = () => {
  const { address, isConnected } = useAccount();
  const { data: trades = [], isLoading } = useUserTrades(address || '');
  const { data: markets = [] } = useMarkets();

  if (!isConnected) {
    return (
      <main className="container max-w-2xl py-20 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
        <p className="text-muted-foreground mb-6">Connect your wallet to view your trades and portfolio.</p>
        <ConnectButton />
      </main>
    );
  }

  const totalInvested = trades.reduce((sum, t) => sum + t.amount, 0);
  const totalPotentialPayout = trades.reduce((sum, t) => sum + t.estimated_payout, 0);
  const activeTrades = trades.filter(t => t.market_status === 'open' || t.market_status === 'resolving');
  const resolvedTrades = trades.filter(t => t.market_status === 'finalized' || t.market_status === 'disputed');

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground mt-1">
          {address?.slice(0, 6)}…{address?.slice(-4)}
        </p>
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trades.length}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Wallet className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalInvested.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Total Invested</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">${totalPotentialPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">Potential Payout</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active positions */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4">Active Positions ({activeTrades.length})</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-card animate-pulse border border-border" />)}
          </div>
        ) : activeTrades.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-3">No active positions yet.</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/markets">Browse Markets <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {activeTrades.map(trade => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      {resolvedTrades.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">Trade History ({resolvedTrades.length})</h2>
          <div className="space-y-2">
            {resolvedTrades.map(trade => (
              <TradeRow key={trade.id} trade={trade} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

function TradeRow({ trade }: { trade: any }) {
  return (
    <Link to={`/market/${trade.market_id}`}>
      <Card className="border-border bg-card hover:bg-secondary/50 transition-colors cursor-pointer">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  trade.position === 'YES'
                    ? 'bg-success/10 text-success border-success/30'
                    : 'bg-destructive/10 text-destructive border-destructive/30'
                }`}
              >
                {trade.position}
              </Badge>
              <p className="text-sm font-medium truncate">{trade.market_question || 'Market'}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <p className="text-sm font-semibold">${trade.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">
                  → ${trade.estimated_payout.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Badge variant="outline" className="text-xs capitalize">
                {trade.market_status || 'open'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default Portfolio;
