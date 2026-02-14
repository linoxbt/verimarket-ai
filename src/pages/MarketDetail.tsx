import { useParams, Link } from 'react-router-dom';
import { demoMarkets } from '@/data/demo-markets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Shield, AlertTriangle } from 'lucide-react';

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
  const market = demoMarkets.find((m) => m.id === id);

  if (!market) {
    return (
      <main className="container py-8 text-center">
        <p className="text-muted-foreground">Market not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
        </Button>
      </main>
    );
  }

  const yesPercent = Math.round(market.yes_probability * 100);

  return (
    <main className="container max-w-3xl py-8">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Markets</Link>
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
                  <span className="text-2xl font-bold text-destructive">{100 - yesPercent}%</span>
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

        {/* Trading placeholder */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Trade</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" disabled={market.status !== 'open'}>
              Buy YES
            </Button>
            <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" disabled={market.status !== 'open'}>
              Buy NO
            </Button>
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
