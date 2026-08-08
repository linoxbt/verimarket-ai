import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { useMarket, usePlaceTrade } from "@/hooks/useMarkets";
import { useArbitrate, useArbitration, useClaimPayout, useDispute, useFileDispute, useResolution, useResolveMarket } from "@/hooks/useResolution";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TradeActivityFeed } from "@/components/TradeActivityFeed";
import { formatExpiry, formatGen, relativeTime, truncateAddress, yesProbability } from "@/lib/format";

const STATUS_TONE = {
  open: "pass",
  resolving: "partial",
  disputed: "fail",
  finalized: "neutral",
} as const;

export default function MarketDetail() {
  const { id } = useParams();
  const marketId = id !== undefined ? Number(id) : undefined;
  const { address } = useWallet();

  const { data: market, isLoading } = useMarket(marketId);
  const { data: resolution } = useResolution(marketId);
  const { data: dispute } = useDispute(marketId);
  const { data: arbitration } = useArbitration(marketId);

  const placeTrade = usePlaceTrade();
  const resolveMarket = useResolveMarket();
  const fileDispute = useFileDispute();
  const arbitrate = useArbitrate();
  const claimPayout = useClaimPayout();

  const [position, setPosition] = useState<"yes" | "no" | null>(null);
  const [amount, setAmount] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");
  const [disputeBond, setDisputeBond] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return <p className="font-mono text-sm text-muted">Loading market…</p>;
  }

  if (!market) {
    return (
      <div>
        <p className="font-mono text-sm text-muted">Market not found.</p>
        <Link to="/markets" className="mt-4 inline-flex items-center gap-2 font-mono text-sm text-accent">
          <ArrowLeft size={14} /> Back to markets
        </Link>
      </div>
    );
  }

  const probability = yesProbability(market.yes_pool, market.no_pool);
  const now = Date.now() / 1000;
  const isExpired = now >= market.expiry;
  const disputeWindowOpen = resolution ? now < resolution.dispute_deadline : false;

  async function runAction(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Transaction failed");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/markets" className="inline-flex w-fit items-center gap-2 font-mono text-sm text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to markets
      </Link>

      <div>
        <div className="mb-2 flex items-center gap-3">
          <Badge tone={STATUS_TONE[market.status]}>{market.status}</Badge>
          <span className="font-mono text-xs uppercase tracking-wide text-muted">{market.category}</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">{market.question}</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Time remaining</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink">{formatExpiry(market.expiry)}</p>
        </Card>
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Probability</p>
          <div className="mt-2 flex items-end gap-4">
            <span className="font-display text-2xl font-bold text-pass">{probability.toFixed(0)}% YES</span>
            <span className="font-display text-2xl font-bold text-fail">{(100 - probability).toFixed(0)}% NO</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-sm bg-surface2">
            <div className="h-full bg-accent" style={{ width: `${probability}%` }} />
          </div>
        </Card>
      </div>

      {market.status === "open" && (
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Trade</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPosition("yes")}
              disabled={isExpired}
              className={`rounded-sm border-2 px-4 py-4 text-center transition-colors disabled:opacity-40 ${
                position === "yes" ? "border-pass bg-pass/10" : "border-line hover:border-pass/50"
              }`}
            >
              <span className="font-display text-lg font-bold text-pass">YES {probability.toFixed(0)}%</span>
            </button>
            <button
              onClick={() => setPosition("no")}
              disabled={isExpired}
              className={`rounded-sm border-2 px-4 py-4 text-center transition-colors disabled:opacity-40 ${
                position === "no" ? "border-fail bg-fail/10" : "border-line hover:border-fail/50"
              }`}
            >
              <span className="font-display text-lg font-bold text-fail">NO {(100 - probability).toFixed(0)}%</span>
            </button>
          </div>

          {position && (
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="number"
                min="0"
                step="0.0001"
                placeholder="Amount in GEN"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
              />
              <Button
                disabled={!amount || Number(amount) <= 0 || placeTrade.isPending || !address}
                onClick={() =>
                  runAction(async () => {
                    await placeTrade.mutateAsync({ marketId: market.id, position, amountGen: amount });
                    setPosition(null);
                    setAmount("");
                  })
                }
              >
                {!address ? "Connect wallet to trade" : placeTrade.isPending ? "Submitting…" : `Buy ${position.toUpperCase()}`}
              </Button>
            </div>
          )}

          {isExpired && <p className="mt-3 font-mono text-xs text-muted">Market has expired and is awaiting resolution.</p>}
        </Card>
      )}

      {market.status === "open" && isExpired && (
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Awaiting resolution</p>
          <p className="mt-2 text-sm text-muted">
            Anyone can trigger resolution once a market has expired — the contract fetches live evidence and
            runs the AI leader/validator consensus.
          </p>
          <Button
            className="mt-3"
            disabled={resolveMarket.isPending || !address}
            onClick={() => runAction(() => resolveMarket.mutateAsync(market.id))}
          >
            {!address ? "Connect wallet to resolve" : resolveMarket.isPending ? "Resolving…" : "Resolve Market"}
          </Button>
        </Card>
      )}

      <Card>
        <p className="font-mono text-xs uppercase tracking-wide text-muted">Resolution criteria</p>
        <p className="mt-2 text-sm text-muted">{market.resolution_criteria}</p>
        <p className="mt-3 font-mono text-[11px] text-muted">
          Source: <span className="text-ink">{market.category} / {market.source_query}</span>
        </p>
      </Card>

      {resolution && (
        <Card>
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              {resolution.outcome === "yes" ? (
                <CheckCircle2 size={18} className="text-pass" />
              ) : (
                <XCircle size={18} className="text-fail" />
              )}
              <span className="font-display text-lg font-bold uppercase text-ink">{resolution.outcome}</span>
              <Badge tone={resolution.outcome === "yes" ? "pass" : "fail"}>
                {resolution.confidence}% confidence
              </Badge>
            </div>
            <span className="font-mono text-[11px] text-muted">{relativeTime(resolution.resolved_at)}</span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink">{resolution.reasoning}</p>
          <div className="mt-4 divide-y divide-line border-t border-line pt-4 font-mono text-[11px] text-muted">
            <p className="pb-2">Evidence hash: {resolution.data_hash}</p>
            <p className="pt-2">Evidence: {resolution.evidence_summary}</p>
          </div>

          {market.status === "resolving" && disputeWindowOpen && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="font-mono text-xs uppercase tracking-wide text-fail">
                Dispute window open — closes {relativeTime(resolution.dispute_deadline)}
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <textarea
                  placeholder="Evidence supporting your dispute"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                  rows={2}
                  className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="Bond amount in GEN"
                  value={disputeBond}
                  onChange={(e) => setDisputeBond(e.target.value)}
                  className="rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
                />
                <Button
                  variant="secondary"
                  disabled={!disputeEvidence || !disputeBond || fileDispute.isPending || !address}
                  onClick={() =>
                    runAction(() =>
                      fileDispute.mutateAsync({ marketId: market.id, evidence: disputeEvidence, bondGen: disputeBond }),
                    )
                  }
                >
                  {fileDispute.isPending ? "Filing…" : "File Dispute"}
                </Button>
              </div>
            </div>
          )}

          {market.status === "resolving" && !disputeWindowOpen && (
            <Button
              className="mt-4"
              disabled={claimPayout.isPending || !address}
              onClick={() => runAction(() => claimPayout.mutateAsync(market.id))}
            >
              {claimPayout.isPending ? "Claiming…" : "Claim Payout"}
            </Button>
          )}
        </Card>
      )}

      {dispute && (
        <Card>
          <p className="font-mono text-xs uppercase tracking-wide text-fail">Dispute filed</p>
          <p className="mt-2 text-sm text-ink">{dispute.evidence}</p>
          <p className="mt-2 font-mono text-[11px] text-muted">
            By {truncateAddress(dispute.disputer)} · Bond {formatGen(dispute.bond_amount)} ·{" "}
            {relativeTime(dispute.filed_at)}
          </p>

          {market.status === "disputed" && !arbitration && (
            <Button
              className="mt-4"
              disabled={arbitrate.isPending || !address}
              onClick={() => runAction(() => arbitrate.mutateAsync(market.id))}
            >
              {arbitrate.isPending ? "Arbitrating…" : "Run Arbitration"}
            </Button>
          )}
        </Card>
      )}

      {arbitration && (
        <Card>
          <div className="flex items-center gap-2 border-b border-line pb-4">
            {arbitration.outcome === "yes" ? (
              <CheckCircle2 size={18} className="text-pass" />
            ) : (
              <XCircle size={18} className="text-fail" />
            )}
            <span className="font-display text-lg font-bold uppercase text-ink">Final: {arbitration.outcome}</span>
            <Badge tone={arbitration.outcome === "yes" ? "pass" : "fail"}>
              {arbitration.confidence}% confidence
            </Badge>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ink">{arbitration.reasoning}</p>

          {market.status === "finalized" && (
            <Button
              className="mt-4"
              disabled={claimPayout.isPending || !address}
              onClick={() => runAction(() => claimPayout.mutateAsync(market.id))}
            >
              {claimPayout.isPending ? "Claiming…" : "Claim Payout"}
            </Button>
          )}
        </Card>
      )}

      {actionError && <p className="font-mono text-xs text-fail">{actionError}</p>}

      <TradeActivityFeed marketId={market.id} />
    </div>
  );
}
