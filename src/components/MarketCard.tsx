import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/types/market';
import { Clock, TrendingUp, Newspaper, Trophy, Cloud, Bitcoin } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  news: <Newspaper className="h-4 w-4" />,
  sports: <Trophy className="h-4 w-4" />,
  crypto: <Bitcoin className="h-4 w-4" />,
  weather: <Cloud className="h-4 w-4" />,
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

const MarketCard = ({ market }: { market: Market }) => {
  const yesPercent = Math.round(market.yes_probability * 100);

  return (
    <Link to={`/market/${market.id}`}>
      <Card className="group cursor-pointer border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-primary">{categoryIcons[market.category]}</span>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {market.category}
              </span>
            </div>
            <Badge variant="outline" className={`text-xs ${statusColors[market.status]}`}>
              {market.status}
            </Badge>
          </div>
          <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {market.question}
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Probability bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-success font-medium">YES {yesPercent}%</span>
              <span className="text-destructive font-medium">NO {100 - yesPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-glow-blue to-glow-purple transition-all"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeUntil(market.expiry)}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{market.api_source}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default MarketCard;
