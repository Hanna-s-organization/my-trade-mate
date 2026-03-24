import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TradingProfile } from '@/lib/types';
import { generateDemoData } from '@/lib/demo-data';
import * as storage from '@/lib/storage';
import { DollarSign, TrendingUp } from 'lucide-react';

interface Props {
  onSetup: (profile: TradingProfile) => void;
  onLoadDemo: () => void;
}

export default function SetupDeposit({ onSetup, onLoadDemo }: Props) {
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

  const handleDemo = () => {
    const { profile, entries } = generateDemoData();
    storage.saveProfile(profile);
    storage.saveEntries(entries);
    onLoadDemo();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <TrendingUp className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Trading Tracker</CardTitle>
          <CardDescription>
            Відстежуйте свої торгові результати
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Початковий депозит ($)
              </label>
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
              Почати
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">або</span>
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={handleDemo}>
              Завантажити демо-дані
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
