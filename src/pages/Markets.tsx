import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { MarketCard } from "@/components/MarketCard";
import { Card } from "@/components/ui/card";
import { useMarkets } from "@/hooks/useMarkets";
import { cn } from "@/lib/utils";
import { formatGen } from "@/lib/format";
import type { Market, MarketCategory } from "@/integrations/genlayer/types";

const CATEGORIES: { label: string; value: MarketCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Crypto", value: "crypto" },
  { label: "Sports", value: "sports" },
  { label: "News", value: "news" },
  { label: "Weather", value: "weather" },
];

type SortKey = "pinned" | "newest" | "volume" | "expiring";

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: "Pinned first", value: "pinned" },
  { label: "Newest", value: "newest" },
  { label: "Highest volume", value: "volume" },
  { label: "Expiring soon", value: "expiring" },
];

const PAGE_SIZE = 12;

function sortMarkets(markets: Market[], sort: SortKey): Market[] {
  const sorted = [...markets];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.id - a.id);
    case "volume":
      return sorted.sort((a, b) => Number(b.yes_pool + b.no_pool - (a.yes_pool + a.no_pool)));
    case "expiring":
      return sorted.sort((a, b) => a.expiry - b.expiry);
    case "pinned":
    default:
      return sorted.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.id - a.id);
  }
}

export default function Markets() {
  const { data: markets = [], isLoading } = useMarkets();
  const [category, setCategory] = useState<MarketCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("pinned");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const visible = markets.filter((m) => !m.hidden);
    const result = visible.filter((m) => {
      const matchCategory = category === "all" || m.category === category;
      const matchSearch = m.question.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
    return sortMarkets(result, sort);
  }, [markets, category, search, sort]);

  useEffect(() => {
    setPage(1);
  }, [category, search, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const visible = markets.filter((m) => !m.hidden);
    const open = visible.filter((m) => m.status === "open").length;
    const inDispute = visible.filter((m) => m.status === "resolving" || m.status === "disputed").length;
    const volume = visible.reduce((sum, m) => sum + m.yes_pool + m.no_pool, 0n);
    return { total: visible.length, open, inDispute, volume };
  }, [markets]);

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-accent">markets</p>
      <h1 className="mt-1 font-display text-2xl font-bold text-ink">Browse markets</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Total Markets</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Open</p>
          <p className="mt-1 font-display text-2xl font-bold text-pass">{stats.open}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Resolving / Disputed</p>
          <p className="mt-1 font-display text-2xl font-bold text-partial">{stats.inDispute}</p>
        </Card>
        <Card className="p-4">
          <p className="font-mono text-xs uppercase tracking-wide text-muted">Total Volume</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">{formatGen(stats.volume)}</p>
        </Card>
      </div>

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

        <div className="flex gap-2">
          <div className="relative w-full sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              placeholder="Search markets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-line bg-surface py-2 pl-8 pr-3 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-sm border border-line bg-surface px-2 py-2 font-mono text-xs text-ink hover:border-accent focus:border-accent focus:outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
            {paged.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        )}

        {!isLoading && pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-40"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <span className="font-mono text-xs text-muted">
              Page {page} of {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="flex items-center gap-1 rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-muted hover:border-accent hover:text-accent disabled:opacity-40"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
