import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MarketCard from '@/components/MarketCard';
import { demoMarkets } from '@/data/demo-markets';
import { Plus, Search } from 'lucide-react';
import type { MarketCategory } from '@/types/market';

const categories: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'all' },
  { label: 'News', value: 'news' },
  { label: 'Sports', value: 'sports' },
  { label: 'Crypto', value: 'crypto' },
  { label: 'Weather', value: 'weather' },
];

const Index = () => {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return demoMarkets.filter((m) => {
      const matchCat = category === 'all' || m.category === category;
      const matchSearch = m.question.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  return (
    <main className="container py-8">
      {/* Hero section */}
      <section className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          AI-Resolved <span className="text-primary">Prediction Markets</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Trade on real-world outcomes resolved by deterministic AI execution on GenLayer's intelligent contracts.
        </p>
        <div className="mt-6">
          <Button asChild size="lg" className="gap-2">
            <Link to="/create">
              <Plus className="h-4 w-4" /> Create Market
            </Link>
          </Button>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="bg-secondary">
            {categories.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search markets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          No markets found.
        </div>
      )}
    </main>
  );
};

export default Index;
