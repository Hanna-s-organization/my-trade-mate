import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Mail, Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Mode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({ title: 'Email sent', description: 'Check your inbox for password reset instructions.' });
        setMode('login');
      } else if (mode === 'signup') {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({ title: 'Sign up successful', description: 'Check your email to confirm your account.' });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const titles = { login: 'Login', signup: 'Sign Up', forgot: 'Reset Password' };
  const descriptions = {
    login: 'Sign in to your account',
    signup: 'Create a new account',
    forgot: 'Enter your email to reset password',
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in card-elevated">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{titles[mode]}</CardTitle>
          <CardDescription>{descriptions[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-9"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? '...' : titles[mode]}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('forgot')} className="text-primary hover:underline block w-full">
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-primary hover:underline">Sign Up</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline">Login</button>
              </p>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
