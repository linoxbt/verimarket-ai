import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { MarketCard } from "@/components/MarketCard";
import { useMarkets } from "@/hooks/useMarkets";
import { cn } from "@/lib/utils";
import type { MarketCategory } from "@/integrations/genlayer/types";

const CATEGORIES: { label: string; value: MarketCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Crypto", value: "crypto" },
  { label: "Sports", value: "sports" },
  { label: "News", value: "news" },
  { label: "Weather", value: "weather" },
];

export default function Markets() {
  const { data: markets = [], isLoading } = useMarkets();
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const visible = markets.filter((m) => !m.hidden);
    const result = visible.filter((m) => {
      const matchCategory = category === "all" || m.category === category;
      const matchSearch = m.question.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
    result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id);
    return result;
  }, [markets, category, search]);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">markets</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Browse markets</h1>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={cn(
                "rounded-sm border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors",
                category === c.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:text-ink",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            placeholder="Search markets…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-line bg-surface py-2 pl-8 pr-3 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="font-mono text-sm text-muted">Loading markets…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-sm border border-line bg-surface p-10 text-center">
            <p className="font-display font-bold text-ink">No markets found</p>
            <p className="mt-1 font-mono text-sm text-muted">Try a different category or search term.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
