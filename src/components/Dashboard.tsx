import { TradingProfile, DailyEntry } from '@/lib/types';
import SummaryCards from './SummaryCards';
import TradingCharts from './TradingCharts';
import EntriesTable from './EntriesTable';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import { Button } from '@/components/ui/button';
import { Settings, TrendingUp, Trash2, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface Props {
  profile: TradingProfile;
  entries: DailyEntry[];
  currentBalance: number;
  onAddEntry: (date: string, profit: number, notes: string, withdrawal?: number) => void;
  onUpdateEntry: (id: string, updates: { profitAmount?: number; notes?: string; date?: string; withdrawal?: number }) => void;
  onDeleteEntry: (id: string) => void;
  onUpdateDeposit: (profile: TradingProfile) => void;
  onClearAll: () => void;
}

export default function Dashboard({
  profile, entries, currentBalance,
  onAddEntry, onUpdateEntry, onDeleteEntry, onUpdateDeposit, onClearAll
}: Props) {
  const [depositInput, setDepositInput] = useState(profile.initialDeposit.toString());
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSaveDeposit = () => {
    const val = parseFloat(depositInput);
    if (isNaN(val) || val <= 0) return;
    onUpdateDeposit({ ...profile, initialDeposit: val });
    setSettingsOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Trading Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">
              Депозит: ${profile.initialDeposit.toLocaleString()}
            </span>
            <ThemeToggle />
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Налаштування</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Початковий депозит ($)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        step="0.01"
                        value={depositInput}
                        onChange={e => setDepositInput(e.target.value)}
                        className="pl-9 font-mono"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveDeposit} className="w-full">Зберегти</Button>
                  <div className="pt-4 border-t">
                    <Button variant="destructive" size="sm" className="w-full" onClick={onClearAll}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Очистити всі дані
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <SummaryCards entries={entries} currentBalance={currentBalance} initialDeposit={profile.initialDeposit} />
        <EntriesTable entries={entries} onAdd={onAddEntry} onUpdate={onUpdateEntry} onDelete={onDeleteEntry} />
        <TradingCharts entries={entries} initialDeposit={profile.initialDeposit} />
      </main>
    </div>
  );
}
