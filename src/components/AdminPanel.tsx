import { useState } from 'react';
import { useMarkets } from '@/hooks/useMarkets';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Pin, PinOff, LogOut, RefreshCw, Zap } from 'lucide-react';

const statusColors: Record<string, string> = {
  open: 'bg-success/20 text-success border-success/30',
  resolving: 'bg-warning/20 text-warning border-warning/30',
  disputed: 'bg-destructive/20 text-destructive border-destructive/30',
  finalized: 'bg-muted text-muted-foreground border-border',
};

const AdminPanel = ({ onLogout }: { onLogout: () => void }) => {
  const { data: markets = [], isLoading } = useMarkets();
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const togglePin = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('markets')
      .update({ pinned: !currentPinned })
      .eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success(currentPinned ? 'Unpinned' : 'Pinned');
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    }
  };

  const deleteMarket = async (id: string) => {
    if (!confirm('Delete this market permanently?')) return;
    const { error } = await supabase.from('markets').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Market deleted');
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    }
  };

  const resolveMarket = async (id: string) => {
    setResolvingId(id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resolve-market`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ market_id: id }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Resolved: ${data.resolution.outcome} (${Math.round(data.resolution.confidence * 100)}% confidence)`);
      queryClient.invalidateQueries({ queryKey: ['markets'] });
    } catch (e: any) {
      toast.error(e.message || 'Resolution failed');
    }
    setResolvingId(null);
  };

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage markets, resolve, pin, or delete</p>
        </div>
        <Button variant="outline" onClick={onLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {markets.map((market) => (
            <Card key={market.id} className="border-border bg-card">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={`text-xs ${statusColors[market.status] || ''}`}>
                        {market.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground uppercase">{market.category}</span>
                      {market.pinned && <Pin className="h-3 w-3 text-primary" />}
                    </div>
                    <p className="text-sm font-medium truncate">{market.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {new Date(market.expiry).toLocaleDateString()} · Vol: ${market.volume?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {market.status === 'open' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveMarket(market.id)}
                        disabled={resolvingId === market.id}
                        className="gap-1 text-xs"
                      >
                        {resolvingId === market.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                        Resolve
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(market.id, market.pinned)}
                    >
                      {market.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteMarket(market.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
};

export default AdminPanel;
