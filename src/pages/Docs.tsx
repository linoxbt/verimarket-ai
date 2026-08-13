import { CONTRACT_ADDRESSES } from "@/integrations/genlayer/client";
import { explorerAddressUrl } from "@/lib/explorer";

const METHODS = [
  { name: "create_market(question, category, source_query, resolution_criteria, expiry)", kind: "write · payable" },
  { name: "place_trade(market_id, position)", kind: "write · payable" },
  { name: "resolve_market(market_id)", kind: "write" },
  { name: "file_dispute(market_id, evidence)", kind: "write · payable" },
  { name: "arbitrate(market_id)", kind: "write" },
  { name: "claim_payout(market_id)", kind: "write" },
  { name: "pin_market / hide_market", kind: "write · admin" },
  { name: "add_admin / remove_admin", kind: "write · owner" },
  { name: "get_market / get_all_markets / get_market_trades / get_user_trades", kind: "view" },
  { name: "get_resolution / get_dispute / get_arbitration", kind: "view" },
  { name: "owner_address / get_admins", kind: "view" },
];

const FEATURES = [
  {
    name: "Notifications",
    note: "A toast on every transaction (success or failure, with a link to the transaction), plus a background watcher that alerts you when a market you created or traded in changes status.",
  },
  {
    name: "Wallet balance",
    note: "Shown in the header, the sidebar, and on your Profile page — polled live from the connected network.",
  },
  {
    name: "Odds over time",
    note: "A chart on each market page built from real trade history — no separate price-feed contract needed.",
  },
  {
    name: "Block explorer links",
    note: "Every address and transaction hash in the app links out to the network's explorer.",
  },
  {
    name: "Sort, search & pagination",
    note: "Markets can be sorted by volume, expiry, or recency, and browsed in pages instead of one long scroll.",
  },
  {
    name: "Markets I created",
    note: "A dedicated tab on Portfolio, alongside your trade history.",
  },
  {
    name: "Confirmation dialogs",
    note: "A review step before trades and disputes — both send real GEN and can't be undone.",
  },
  {
    name: "Profile page",
    note: "Address, balance, network switcher, theme, and help/support links in one place.",
  },
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
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Creating a market requires posting a GEN bond, which is split evenly into the YES/NO pool as
        initial liquidity — it isn't refunded to the creator, it just becomes part of what the eventual
        winning side is paid from.
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
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Filing a dispute requires posting a GEN bond. If arbitration overturns the original resolution —
          the dispute was right — the bond is refunded in full to the disputer. If arbitration confirms the
          original outcome, the bond is forfeited to the contract owner, the cost of a failed dispute.
        </p>
      </section>

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-xl font-bold text-ink">App features</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Everything below is built on top of the contract reads/writes above — no new backend, no new
          contract methods.
        </p>
        <div className="mt-4 divide-y divide-line rounded-sm border border-line">
          {FEATURES.map((f) => (
            <div key={f.name} className="flex flex-col gap-1 p-4">
              <span className="font-mono text-sm text-ink">{f.name}</span>
              <span className="font-mono text-xs text-muted">{f.note}</span>
            </div>
          ))}
        </div>
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
            {CONTRACT_ADDRESSES.studionet ? (
              <a
                href={explorerAddressUrl("studionet", CONTRACT_ADDRESSES.studionet)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent hover:opacity-80"
              >
                {CONTRACT_ADDRESSES.studionet}
              </a>
            ) : (
              <code className="font-mono text-xs text-muted">not yet deployed</code>
            )}
          </div>
          <div className="flex items-center justify-between p-4">
            <span className="font-mono text-sm text-ink">Testnet Asimov</span>
            {CONTRACT_ADDRESSES.testnetAsimov ? (
              <a
                href={explorerAddressUrl("testnetAsimov", CONTRACT_ADDRESSES.testnetAsimov)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent hover:opacity-80"
              >
                {CONTRACT_ADDRESSES.testnetAsimov}
              </a>
            ) : (
              <code className="font-mono text-xs text-muted">not yet deployed</code>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
