import { CONTRACT_ADDRESSES } from "@/integrations/genlayer/client";

const METHODS = [
  { name: "create_market(question, category, source_query, resolution_criteria, expiry)", kind: "write" },
  { name: "place_trade(market_id, position)", kind: "write · payable" },
  { name: "resolve_market(market_id)", kind: "write" },
  { name: "file_dispute(market_id, evidence)", kind: "write · payable" },
  { name: "arbitrate(market_id)", kind: "write" },
  { name: "claim_payout(market_id)", kind: "write" },
  { name: "pin_market / hide_market", kind: "write · owner" },
  { name: "get_market / get_all_markets / get_market_trades / get_user_trades", kind: "view" },
  { name: "get_resolution / get_dispute / get_arbitration", kind: "view" },
];

const SOURCES = [
  { category: "crypto", source: "CoinGecko", note: "public API, no key required" },
  { category: "sports", source: "TheSportsDB", note: "public test key" },
  {
    category: "news",
    source: "GDELT DOC 2.0",
    note: "free, no key — swapped in for NewsAPI, which needs a secret key that can't live in public contract code",
  },
  {
    category: "weather",
    source: "Open-Meteo",
    note: "free, no key — swapped in for OpenWeather for the same reason",
  },
];

export default function Docs() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">docs</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-ink">How VeriMarket works</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        VeriMarket is a single GenLayer Intelligent Contract, <code className="font-mono text-ink">VeriMarket</code>.
        There is no off-chain backend, no oracle service, and no database — every market, trade, resolution,
        dispute and arbitration lives entirely in contract storage, and every read in this app is a live
        contract call.
      </p>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold text-ink">Resolution: leader/validator consensus</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          When a market expires, <code className="font-mono text-ink">resolve_market</code> fetches live
          evidence from a whitelisted public API and asks an LLM to decide the outcome — but the leader's
          answer isn't trusted on its own. Every validator independently re-fetches the same evidence and
          re-runs the same prompt, then the network only accepts the outcome if the leader and validators
          agree (exact match on <code className="font-mono text-ink">outcome</code>, confidence within a
          15-point tolerance). The free-text reasoning isn't compared — models phrase things differently —
          only the decision itself has to match. This is GenLayer's Equivalence Principle.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Disputes and arbitration reuse the exact same mechanism —{" "}
          <code className="font-mono text-ink">arbitrate</code> runs another leader/validator round, this
          time with the disputer's evidence added to the prompt alongside the original evidence and
          reasoning.
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold text-ink">Evidence sources</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Contract source (and anything a contract holds) is effectively public — leader and validators both
          execute it — so secret API keys can't live on-chain. Every source below is keyless.
        </p>
        <div className="mt-4 divide-y divide-line rounded-sm border border-line">
          {SOURCES.map((s) => (
            <div key={s.category} className="flex flex-col gap-1 p-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-xs uppercase tracking-wide text-accent">{s.category}</span>
                <span className="font-mono text-sm text-ink">{s.source}</span>
              </div>
              <span className="font-mono text-xs text-muted">{s.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold text-ink">Contract interface</h2>
        <div className="mt-4 divide-y divide-line rounded-sm border border-line">
          {METHODS.map((m) => (
            <div key={m.name} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
              <code className="font-mono text-xs text-ink">{m.name}</code>
              <span className="font-mono text-[11px] uppercase tracking-wide text-muted">{m.kind}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold text-ink">Deployments</h2>
        <div className="mt-4 divide-y divide-line rounded-sm border border-line">
          <div className="flex items-center justify-between p-4">
            <span className="font-mono text-sm text-ink">Studionet</span>
            <code className="font-mono text-xs text-accent">{CONTRACT_ADDRESSES.studionet}</code>
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="font-mono text-sm text-ink">Testnet Asimov</span>
            <code className="font-mono text-xs text-muted">
              {CONTRACT_ADDRESSES.testnetAsimov ?? "not yet deployed"}
            </code>
          </div>
        </div>
      </section>
    </div>
  );
}
