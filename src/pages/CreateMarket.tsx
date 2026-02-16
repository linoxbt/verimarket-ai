import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateMarket } from '@/hooks/useMarkets';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const apiSources: Record<string, Array<{ label: string; value: string }>> = {
  news: [{ label: 'NewsAPI', value: 'newsapi' }],
  sports: [{ label: 'TheSportsDB', value: 'thesportsdb' }],
  crypto: [{ label: 'CoinGecko', value: 'coingecko' }],
  weather: [{ label: 'OpenWeather', value: 'openweather' }],
};

const CreateMarket = () => {
  const navigate = useNavigate();
  const createMarket = useCreateMarket();
  const [question, setQuestion] = useState('');
  const [criteria, setCriteria] = useState('');
  const [category, setCategory] = useState('');
  const [apiSource, setApiSource] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    });
  }, []);

  if (isAdmin === null) return <main className="container py-20 text-center"><p className="text-muted-foreground">Loading...</p></main>;
  if (!isAdmin) {
    navigate('/markets');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !criteria || !category || !apiSource || !expiryDate) {
      toast.error('Please fill in all fields');
      return;
    }
    try {
      await createMarket.mutateAsync({
        question,
        category,
        resolution_criteria: criteria,
        expiry: expiryDate.toISOString(),
        api_source: apiSource,
      });
      toast.success('Market created successfully!');
      navigate('/markets');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create market');
    }
  };

  return (
    <main className="container max-w-2xl py-8">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl">Create Prediction Market</CardTitle>
          <CardDescription>Define a measurable question to be resolved by AI using verified data sources.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="question">Market Question</Label>
              <Input
                id="question"
                placeholder="Will BTC exceed $120,000 by March 31, 2026?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-secondary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria">Resolution Criteria</Label>
              <Textarea
                id="criteria"
                placeholder="Bitcoin price must be above $120,000 USD on CoinGecko at the expiry timestamp."
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                className="bg-secondary min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setApiSource(''); }}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>API Source</Label>
                <Select value={apiSource} onValueChange={setApiSource} disabled={!category}>
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {category && apiSources[category]?.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-secondary",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, "PPP") : "Pick expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {question && criteria && category && (
              <Card className="border-border bg-secondary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Resolution Template Preview</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground font-mono">
                  <p>Question: {question}</p>
                  <p>Criteria: {criteria}</p>
                  <p>Source: {apiSource || '(select source)'}</p>
                  <p>Expiry: {expiryDate ? format(expiryDate, "PPP") : '(select date)'}</p>
                </CardContent>
              </Card>
            )}

            <Button type="submit" className="w-full" size="lg">
              Create Market
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default CreateMarket;
