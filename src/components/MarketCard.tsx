import { Link } from "react-router-dom";
import { Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Market } from "@/integrations/genlayer/types";
import { formatExpiry, formatGen, yesProbability } from "@/lib/format";

const STATUS_TONE: Record<Market["status"], "pass" | "partial" | "fail" | "neutral"> = {
  open: "pass",
  resolving: "partial",
  disputed: "fail",
  finalized: "neutral",
};

export function MarketCard({ market }: { market: Market }) {
  const probability = yesProbability(market.yes_pool, market.no_pool);
  const volume = market.yes_pool + market.no_pool;

  return (
    <Link to={`/market/${market.id}`}>
      <Card className="flex h-full flex-col gap-4 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
            {market.pinned && <Pin size={11} className="text-accent" />}
            {market.category}
          </span>
          <Badge tone={STATUS_TONE[market.status]}>{market.status}</Badge>
        </div>

        <h3 className="font-display text-lg font-bold leading-snug text-ink">{market.question}</h3>

        <div className="mt-auto flex flex-col gap-2">
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-surface2">
            <div className="h-full bg-accent" style={{ width: `${probability}%` }} />
          </div>
          <div className="flex items-center justify-between font-mono text-xs text-muted">
            <span>{probability.toFixed(0)}% YES</span>
            <span>{formatGen(volume)}</span>
          </div>
          <div className="font-mono text-[11px] text-muted">{formatExpiry(market.expiry)}</div>
        </div>
      </Card>
    </Link>
  );
}
