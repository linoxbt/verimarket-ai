import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MarketCard from '@/components/MarketCard';
import { useMarkets } from '@/hooks/useMarkets';
import { Plus, TrendingUp, BarChart3, Zap, Shield, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const { data: markets = [], isLoading } = useMarkets();

  const openMarkets = markets.filter(m => m.status === 'open');
  const resolvingMarkets = markets.filter(m => m.status === 'resolving' || m.status === 'disputed');
  const totalVolume = markets.reduce((sum, m) => sum + (m.volume || 0), 0);
  const pinnedOrTop = markets.filter(m => m.pinned).length > 0
    ? markets.filter(m => m.pinned)
    : markets.slice(0, 3);

  return (
    <main className="container py-8">
      {/* Hero */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          AI-Resolved <span className="text-primary">Prediction Markets</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Trade on real-world outcomes resolved by deterministic AI execution on GenLayer's intelligent contracts.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link to="/create">
              <Plus className="h-4 w-4" /> Create Market
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/markets">
              <TrendingUp className="h-4 w-4" /> Browse Markets
            </Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-4 mb-10">
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{markets.length}</p>
                <p className="text-xs text-muted-foreground">Total Markets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Zap className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openMarkets.length}</p>
                <p className="text-xs text-muted-foreground">Active Markets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resolvingMarkets.length}</p>
                <p className="text-xs text-muted-foreground">Resolving/Disputed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <p className="text-xs text-muted-foreground">Total Volume</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Featured markets */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Featured Markets</h2>
          <Button asChild variant="ghost" size="sm" className="gap-1 text-muted-foreground">
            <Link to="/markets">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3].map(i => <div key={i} className="h-48 rounded-lg bg-card animate-pulse border border-border" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedOrTop.map((market) => (
              <MarketCard key={market.id} market={market as any} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">How VeriMarket Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '1', title: 'Create or Trade', desc: 'Create prediction markets or trade YES/NO on existing ones.' },
            { step: '2', title: 'AI Resolution', desc: 'At expiry, AI evaluates bounded evidence from verified APIs.' },
            { step: '3', title: 'Dispute & Finalize', desc: '24h dispute window with AI arbitration for final outcomes.' },
          ].map(s => (
            <Card key={s.step} className="border-border bg-card">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{s.step}</span>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
