import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateMarket } from "@/hooks/useMarkets";
import { useWallet } from "@/integrations/genlayer/WalletProvider";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type MarketCategory } from "@/integrations/genlayer/types";

const SOURCE_HINTS: Record<MarketCategory, { label: string; placeholder: string; help: string }> = {
  crypto: {
    label: "CoinGecko coin id",
    placeholder: "bitcoin",
    help: "The CoinGecko API id for the asset, e.g. bitcoin, ethereum.",
  },
  sports: {
    label: "TheSportsDB event query",
    placeholder: "Arsenal_vs_Chelsea",
    help: "Team names as they appear in TheSportsDB's event search.",
  },
  news: {
    label: "GDELT search query",
    placeholder: "genlayer intelligent contracts",
    help: "Keywords to search recent news coverage for.",
  },
  weather: {
    label: "Coordinates (lat,lon)",
    placeholder: "40.7128,-74.006",
    help: "Latitude and longitude for the Open-Meteo forecast.",
  },
};

function toUnixTimestamp(datetimeLocal: string): number {
  return Math.floor(new Date(datetimeLocal).getTime() / 1000);
}

export default function CreateMarket() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const createMarket = useCreateMarket();

  const [question, setQuestion] = useState("");
  const [criteria, setCriteria] = useState("");
  const [category, setCategory] = useState<MarketCategory>("crypto");
  const [sourceQuery, setSourceQuery] = useState("");
  const [expiry, setExpiry] = useState("");
  const [bond, setBond] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hint = SOURCE_HINTS[category];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!question || !criteria || !sourceQuery || !expiry) {
      setError("Please fill in all fields.");
      return;
    }

    if (!bond || Number(bond) <= 0) {
      setError("A bond greater than 0 GEN is required to create a market.");
      return;
    }

    if (!address) {
      await connect();
      return;
    }

    try {
      await createMarket.mutateAsync({
        question,
        category,
        sourceQuery,
        resolutionCriteria: criteria,
        expiry: toUnixTimestamp(expiry),
        bondGen: bond,
      });
      navigate("/markets");
    } catch {
      // toasted by useCreateMarket's onError
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-widest text-accent">create</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Create a market</h1>
      <p className="mt-2 text-sm text-muted">
        Markets are resolved by a GenLayer Intelligent Contract that fetches evidence from the source below
        and reaches multi-validator consensus on the outcome. Creating a market requires a GEN bond, which
        seeds both sides of the pool as initial liquidity.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wide text-muted">Question</label>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Will BTC exceed $120,000 by March 31, 2026?"
            className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wide text-muted">Resolution criteria</label>
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            placeholder="Resolves YES if the CoinGecko USD price for bitcoin is above 120000 at expiry."
            rows={3}
            className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs uppercase tracking-wide text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as MarketCategory);
                setSourceQuery("");
              }}
              className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c[0].toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-mono text-xs uppercase tracking-wide text-muted">Expiry</label>
            <input
              type="datetime-local"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wide text-muted">{hint.label}</label>
          <input
            value={sourceQuery}
            onChange={(e) => setSourceQuery(e.target.value)}
            placeholder={hint.placeholder}
            className="rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p className="font-mono text-[11px] text-muted">{hint.help}</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-xs uppercase tracking-wide text-muted">Creation bond (GEN)</label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={bond}
            onChange={(e) => setBond(e.target.value)}
            placeholder="0.001"
            className="rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p className="font-mono text-[11px] text-muted">
            Split evenly into the YES/NO pool as initial liquidity — not refunded to you directly.
          </p>
        </div>

        {error && <p className="font-mono text-xs text-fail">{error}</p>}

        <Button type="submit" disabled={createMarket.isPending} className="w-full">
          {createMarket.isPending ? "Submitting…" : address ? "Create Market" : "Connect Wallet to Create"}
        </Button>
      </form>
    </div>
  );
}
