import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingProfile } from '@/lib/types';
import { DollarSign } from 'lucide-react';
import TradelyLogo from './TradelyLogo';

interface Props {
  onSetup: (profile: TradingProfile) => void;
}

export default function SetupDeposit({ onSetup }: Props) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    const profile: TradingProfile = {
      initialDeposit: val,
      currency: 'USD',
      createdAt: new Date().toISOString(),
    };
    onSetup(profile);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in card-elevated">
        <CardHeader className="text-center space-y-2">
          <TradelyLogo size={56} showWordmark={false} className="mx-auto" />
          <CardTitle className="text-2xl font-bold">Tradely</CardTitle>
          <CardDescription>Track your trading performance with clarity</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Initial Deposit ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="10000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-9 font-mono text-lg"
                  autoFocus
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={!amount || parseFloat(amount) <= 0}>
              Get Started
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
