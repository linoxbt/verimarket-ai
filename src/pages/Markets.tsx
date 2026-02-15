import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketCard from '@/components/MarketCard';
import { useMarkets } from '@/hooks/useMarkets';
import { Search, TrendingUp, Flame, Clock } from 'lucide-react';

const categories = [
  { label: 'All', value: 'all' },
  { label: '🔥 Trending', value: 'trending' },
  { label: 'News', value: 'news' },
  { label: 'Sports', value: 'sports' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Weather', value: 'weather' },
];

const sortOptions = [
  { label: 'Newest', value: 'newest', icon: Clock },
  { label: 'Volume', value: 'volume', icon: TrendingUp },
  { label: 'Ending Soon', value: 'ending', icon: Flame },
];

const Markets = () => {
  const { data: markets = [], isLoading } = useMarkets();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  const filtered = useMemo(() => {
    let result = markets.filter((m) => {
      if (category === 'trending') return m.volume > 10000;
      const matchCat = category === 'all' || m.category === category;
      const matchSearch = m.question.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });

    if (sort === 'volume') result.sort((a, b) => b.volume - a.volume);
    else if (sort === 'ending') result.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
    else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Pinned first
    result.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    return result;
  }, [category, search, sort, markets]);

  return (
    <main className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Markets</h1>
        <p className="text-muted-foreground text-sm">Browse and trade on live prediction markets</p>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="bg-secondary">
              {categories.map((c) => (
                <TabsTrigger key={c.value} value={c.value} className="text-xs">
                  {c.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            {sortOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sort === s.value
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <s.icon className="h-3 w-3" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-48 rounded-lg bg-card animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((market) => (
              <MarketCard key={market.id} market={market as any} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              No markets found.
            </div>
          )}
        </>
      )}
    </main>
  );
};

export default Markets;
