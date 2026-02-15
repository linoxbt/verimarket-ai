import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/types/market';
import { Clock, TrendingUp, Newspaper, Trophy, Cloud, Bitcoin, Pin } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  news: <Newspaper className="h-3.5 w-3.5" />,
  sports: <Trophy className="h-3.5 w-3.5" />,
  crypto: <Bitcoin className="h-3.5 w-3.5" />,
  weather: <Cloud className="h-3.5 w-3.5" />,
};

const statusColors: Record<string, string> = {
  open: 'bg-success/20 text-success border-success/30',
  resolving: 'bg-warning/20 text-warning border-warning/30',
  disputed: 'bg-destructive/20 text-destructive border-destructive/30',
  finalized: 'bg-muted text-muted-foreground border-border',
};

function timeUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

interface MarketCardProps {
  market: Market & { pinned?: boolean; volume?: number };
}

const MarketCard = ({ market }: MarketCardProps) => {
  const yesPercent = Math.round(market.yes_probability * 100);
  const noPercent = 100 - yesPercent;

  return (
    <Link to={`/market/${market.id}`}>
      <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 h-full">
        <CardContent className="p-4 flex flex-col h-full">
          {/* Top row: category + status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{categoryIcons[market.category]}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {market.category}
              </span>
              {market.pinned && <Pin className="h-3 w-3 text-primary" />}
            </div>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[market.status]}`}>
              {market.status}
            </Badge>
          </div>

          {/* Question */}
          <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-auto">
            {market.question}
          </h3>

          {/* Polymarket-style YES/NO buttons */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="flex items-center justify-between rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-left transition-colors hover:bg-success/20">
              <span className="text-xs font-medium text-success">Yes</span>
              <span className="text-sm font-bold text-success">{yesPercent}¢</span>
            </button>
            <button className="flex items-center justify-between rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-left transition-colors hover:bg-destructive/20">
              <span className="text-xs font-medium text-destructive">No</span>
              <span className="text-sm font-bold text-destructive">{noPercent}¢</span>
            </button>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeUntil(market.expiry)}</span>
            </div>
            {market.volume !== undefined && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>${Math.round(market.volume).toLocaleString()} Vol.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MarketCard;
