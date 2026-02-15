import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import AdminPanel from '@/components/AdminPanel';
import { Shield } from 'lucide-react';

const AdminAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sess.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      } else {
        setIsAdmin(false);
      }
      setChecking(false);
    });

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sess.user.id)
          .eq('role', 'admin')
          .maybeSingle();
        setIsAdmin(!!data);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setSession(null);
  };

  if (checking) {
    return (
      <main className="container max-w-md py-20 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    );
  }

  if (session && isAdmin) {
    return <AdminPanel onLogout={handleLogout} />;
  }

  if (session && !isAdmin) {
    return (
      <main className="container max-w-md py-20">
        <Card className="border-border bg-card">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-sm mb-4">Your account does not have admin privileges.</p>
            <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="container max-w-md py-20">
      <Card className="border-border bg-card">
        <CardHeader className="text-center">
          <Shield className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in to manage markets</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@verimarket.app"
                className="bg-secondary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-secondary"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};

export default AdminAuth;
