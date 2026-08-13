import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, Wallet } from "lucide-react";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { useUserTrades } from "@/hooks/useTrades";
import { useMarkets } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketCard } from "@/components/MarketCard";
import { cn } from "@/lib/utils";
import { formatGen, truncateAddress } from "@/lib/format";
import { explorerAddressUrl } from "@/lib/explorer";

type Tab = "trades" | "created";

export default function Portfolio() {
  const { address, network, connect, connecting } = useWallet();
  const { data: trades = [], isLoading } = useUserTrades(address ?? undefined);
  const { data: markets = [] } = useMarkets();
  const [tab, setTab] = useState<Tab>("trades");

  const created = useMemo(
    () => markets.filter((m) => !m.hidden && m.creator.toLowerCase() === (address ?? "").toLowerCase()),
    [markets, address],
  );

  if (!address) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Wallet size={32} className="mx-auto mb-4 text-muted" />
        <h1 className="font-display text-xl font-bold text-ink">Connect your wallet</h1>
        <p className="mt-2 text-sm text-muted">Connect a wallet to view your trades and positions.</p>
        <button
          onClick={() => connect()}
          disabled={connecting}
          className="mt-6 rounded-sm bg-accent px-5 py-2.5 font-mono text-sm text-bg hover:opacity-90"
        >
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  const marketById = new Map(markets.map((m) => [m.id, m]));
  const totalStaked = trades.reduce((sum, t) => sum + t.amount, 0n);
  const active = trades.filter((t) => {
    const m = marketById.get(t.market_id);
    return m && (m.status === "open" || m.status === "resolving" || m.status === "disputed");
  });
  const settled = trades.filter((t) => {
    const m = marketById.get(t.market_id);
    return m && m.status === "finalized";
  });

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">portfolio</p>
      <a
        href={explorerAddressUrl(network, address)}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-flex items-center gap-2 font-display text-2xl font-bold text-ink hover:text-accent"
      >
        {truncateAddress(address)}
        <ExternalLink size={16} className="text-muted" />
      </a>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Total trades</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{trades.length}</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Total staked</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{formatGen(totalStaked)}</p>
        </Card>
      </div>

      <div className="mt-8 flex gap-2 border-b border-line">
        {(
          [
            { key: "trades", label: `Trades (${trades.length})` },
            { key: "created", label: `Markets I created (${created.length})` },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 font-mono text-xs uppercase tracking-wide transition-colors",
              tab === t.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "trades" && (
        <>
          <section className="mt-6">
            <h2 className="font-display text-lg font-bold text-ink">Active positions ({active.length})</h2>
            {isLoading ? (
              <p className="mt-3 font-mono text-sm text-muted">Loading…</p>
            ) : active.length === 0 ? (
              <Card className="mt-3 text-center">
                <p className="text-sm text-muted">No active positions yet.</p>
                <Link to="/markets" className="mt-3 inline-flex items-center gap-1 font-mono text-sm text-accent">
                  Browse markets <ArrowRight size={13} />
                </Link>
              </Card>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {active.map((trade, i) => (
                  <TradeRow key={i} trade={trade} question={marketById.get(trade.market_id)?.question} status={marketById.get(trade.market_id)?.status} />
                ))}
              </div>
            )}
          </section>

          {settled.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-bold text-ink">History ({settled.length})</h2>
              <div className="mt-3 flex flex-col gap-2">
                {settled.map((trade, i) => (
                  <TradeRow key={i} trade={trade} question={marketById.get(trade.market_id)?.question} status={marketById.get(trade.market_id)?.status} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {tab === "created" && (
        <section className="mt-6">
          {created.length === 0 ? (
            <Card className="text-center">
              <p className="text-sm text-muted">You haven't created any markets yet.</p>
              <Link to="/create" className="mt-3 inline-flex items-center gap-1 font-mono text-sm text-accent">
                Create a market <ArrowRight size={13} />
              </Link>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {created.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TradeRow({
  trade,
  question,
  status,
}: {
  trade: { market_id: number; position: string; amount: bigint };
  question?: string;
  status?: string;
}) {
  return (
    <Link to={`/market/${trade.market_id}`}>
      <Card className="flex items-center justify-between gap-4 transition-colors hover:border-accent">
        <div className="flex min-w-0 items-center gap-3">
          <Badge tone={trade.position === "yes" ? "pass" : "fail"}>{trade.position}</Badge>
          <p className="truncate font-mono text-sm text-ink">{question ?? `Market #${trade.market_id}`}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-sm font-bold text-ink">{formatGen(trade.amount)}</span>
          {status && <Badge tone="neutral">{status}</Badge>}
        </div>
      </Card>
    </Link>
  );
}
