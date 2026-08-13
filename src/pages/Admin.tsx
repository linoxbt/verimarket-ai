import { Link } from "react-router-dom";
import { Pin, PinOff, ShieldOff } from "lucide-react";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { useIsOwner } from "@/hooks/useOwner";
import { useHideMarket, useMarkets, usePinMarket } from "@/hooks/useMarkets";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Admin() {
  const { address, connect } = useWallet();
  const { isOwner, isLoading } = useIsOwner();
  const { data: markets = [] } = useMarkets();
  const pinMarket = usePinMarket();
  const hideMarket = useHideMarket();

  if (!address) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldOff size={32} className="mx-auto mb-4 text-muted" />
        <h1 className="font-display text-xl font-bold text-ink">Connect your wallet</h1>
        <p className="mt-2 text-sm text-muted">Admin actions require an admin wallet.</p>
        <button
          onClick={() => connect()}
          className="mt-6 rounded-sm bg-accent px-5 py-2.5 font-mono text-sm text-bg hover:opacity-90"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <p className="font-mono text-sm text-muted">Checking owner…</p>;
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldOff size={32} className="mx-auto mb-4 text-fail" />
        <h1 className="font-display text-xl font-bold text-ink">Not authorized</h1>
        <p className="mt-2 text-sm text-muted">Only admin wallets can access admin actions.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">admin</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Market administration</h1>
      <p className="mt-2 text-sm text-muted">
        Connected as an admin wallet. Pin markets to feature them, or hide ones that shouldn't be listed.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {markets.map((market) => (
          <Card key={market.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Link to={`/market/${market.id}`} className="truncate font-mono text-sm text-ink hover:text-accent">
                {market.question}
              </Link>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="neutral">{market.status}</Badge>
                {market.hidden && <Badge tone="fail">hidden</Badge>}
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => pinMarket.mutate({ marketId: market.id, pinned: !market.pinned })}
              >
                {market.pinned ? <PinOff size={13} /> : <Pin size={13} />}
              </Button>
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => hideMarket.mutate({ marketId: market.id, hidden: !market.hidden })}
              >
                {market.hidden ? "Unhide" : "Hide"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
