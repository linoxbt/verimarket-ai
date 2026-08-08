import { Activity } from "lucide-react";
import { useMarketTrades } from "@/hooks/useTrades";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatGen, relativeTime, truncateAddress } from "@/lib/format";

export function TradeActivityFeed({ marketId }: { marketId: number }) {
  const { data: trades = [], isLoading } = useMarketTrades(marketId);
  const sorted = [...trades].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-muted">
        <Activity size={14} className="text-accent" /> Recent Activity
      </div>

      {isLoading ? (
        <p className="font-mono text-sm text-muted">Loading trades…</p>
      ) : sorted.length === 0 ? (
        <p className="font-mono text-sm text-muted">No trades yet. Be the first.</p>
      ) : (
        <div className="divide-y divide-line">
          {sorted.map((trade, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <Badge tone={trade.position === "yes" ? "pass" : "fail"}>{trade.position}</Badge>
                <span className="truncate font-mono text-xs text-muted">{truncateAddress(trade.trader)}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-xs font-bold text-ink">{formatGen(trade.amount)}</span>
                <span className="font-mono text-[11px] text-muted">{relativeTime(trade.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
