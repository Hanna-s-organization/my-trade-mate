import { TradingProfile, DailyEntry } from '@/lib/types';
import SummaryCards from './SummaryCards';
import TradingCharts from './TradingCharts';
import EntriesTable from './EntriesTable';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import TradelyLogo from './TradelyLogo';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, DollarSign, Eye, EyeOff, BadgePercent } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const [showBalance, setShowBalance] = useState(true);
  const [showProfitAmounts, setShowProfitAmounts] = useState(true);

  useEffect(() => {
    const savedBalance = window.localStorage.getItem('show-balance');
    if (savedBalance !== null) {
      setShowBalance(savedBalance === 'true');
    }
    const savedProfit = window.localStorage.getItem('show-profit-amounts');
    if (savedProfit !== null) {
      setShowProfitAmounts(savedProfit === 'true');
    }
  }, []);

  const toggleBalanceVisibility = () => {
    setShowBalance((current) => {
      const next = !current;
      window.localStorage.setItem('show-balance', String(next));
      return next;
    });
  };

  const toggleProfitVisibility = () => {
    setShowProfitAmounts((current) => {
      const next = !current;
      window.localStorage.setItem('show-profit-amounts', String(next));
      return next;
    });
  };

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
            <TradelyLogo size={32} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">
              Deposit: {showBalance ? `$${profile.initialDeposit.toLocaleString()}` : '••••••'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleBalanceVisibility}
              aria-label={showBalance ? 'Hide balance values' : 'Show balance values'}
              title={showBalance ? 'Hide balance values' : 'Show balance values'}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleProfitVisibility}
              aria-label={showProfitAmounts ? 'Hide profit amounts' : 'Show profit amounts'}
              title={showProfitAmounts ? 'Hide profit amounts' : 'Show profit amounts'}
            >
              {showProfitAmounts ? <BadgePercent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
            </Button>
            <ThemeToggle />
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Initial Deposit ($)</label>
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
                  <Button onClick={handleSaveDeposit} className="w-full">Save</Button>
                  <div className="pt-4 border-t">
                    <Button variant="destructive" size="sm" className="w-full" onClick={onClearAll}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear All Data
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
        <SummaryCards
          entries={entries}
          currentBalance={currentBalance}
          initialDeposit={profile.initialDeposit}
          showBalance={showBalance}
          showProfitAmounts={showProfitAmounts}
        />
        <EntriesTable
          entries={entries}
          onAdd={onAddEntry}
          onUpdate={onUpdateEntry}
          onDelete={onDeleteEntry}
          showBalance={showBalance}
          showProfitAmounts={showProfitAmounts}
        />
        <TradingCharts
          entries={entries}
          initialDeposit={profile.initialDeposit}
          showBalance={showBalance}
          showProfitAmounts={showProfitAmounts}
        />
      </main>
    </div>
  );
}
