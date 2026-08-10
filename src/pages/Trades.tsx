import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarRange, ExternalLink, Hourglass, Plus, Search, Target, Trash2, TrendingUp, Wallet } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import Auth from './Auth';
import { useAuth } from '@/hooks/useAuth';
import { AccountEntity, TradeEntry } from '@/lib/types';
import { deriveTrades, loadAccounts, loadTrades, saveTrades, TradeOutcome } from '@/lib/trades-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const outcomeLabels: Record<TradeOutcome, string> = {
  win: 'Win',
  loss: 'Lose',
  breakeven: 'BE',
  'in-progress': 'InProgress',
  missed: 'Missed',
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatTradeDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}-${month}-${year}` : value;
}

function formatSignedCurrency(value: number) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatSignedNumber(value: number) {
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

function getAccountDisplayBalance(account: AccountEntity) {
  return account.currentBalance > 0 ? account.currentBalance : account.startingBalance;
}

export default function TradesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TradeEntry[]>(() => loadTrades());
  const [accounts] = useState<AccountEntity[]>(() => loadAccounts());
  const [search, setSearch] = useState('');
  const [statsView, setStatsView] = useState<'month' | 'quarter'>('month');

  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(
        entries
          .map((entry) => Number(entry.date.split('-')[0]))
          .filter((value) => Number.isFinite(value)),
      ),
    ).sort((a, b) => b - a);

    const currentYear = new Date().getFullYear();
    return years.length > 0 ? years : [currentYear];
  }, [entries]);

  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<string>(String(availableYears[0] ?? today.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(String(today.getMonth() + 1));

  const selectedQuarter = useMemo(() => Math.ceil(Number(selectedMonth) / 3), [selectedMonth]);

  const stats = useMemo(() => {
    const closedTrades = entries.filter((entry) => entry.outcome === 'win' || entry.outcome === 'loss' || entry.outcome === 'breakeven');
    const winningTrades = entries.filter((entry) => entry.outcome === 'win').length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
    const netProfit = entries.reduce((sum, entry) => sum + entry.allProfitDollar, 0);

    return {
      winningTrades,
      closedTrades: closedTrades.length,
      inProgressTrades: entries.filter((entry) => entry.outcome === 'in-progress').length,
      winRate,
      netProfit,
    };
  }, [entries]);

  const periodEntries = useMemo(() => {
    const year = Number(selectedYear);
    const month = Number(selectedMonth);

    return entries.filter((entry) => {
      const [entryYearRaw, entryMonthRaw] = entry.date.split('-');
      const entryYear = Number(entryYearRaw);
      const entryMonth = Number(entryMonthRaw);
      if (entryYear !== year) return false;

      if (statsView === 'month') {
        return entryMonth === month;
      }

      const quarter = Math.ceil(entryMonth / 3);
      return quarter === selectedQuarter;
    });
  }, [entries, selectedMonth, selectedQuarter, selectedYear, statsView]);

  const periodStats = useMemo(() => {
    const closedTrades = periodEntries.filter((entry) => entry.outcome === 'win' || entry.outcome === 'loss' || entry.outcome === 'breakeven');
    const wins = closedTrades.filter((entry) => entry.outcome === 'win').length;
    const losses = closedTrades.filter((entry) => entry.outcome === 'loss').length;
    const breakeven = closedTrades.filter((entry) => entry.outcome === 'breakeven').length;
    const missed = periodEntries.filter((entry) => entry.outcome === 'missed').length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
    const totalProfitDollar = periodEntries.reduce((sum, entry) => sum + entry.profitDollar, 0);
    const totalProfitPercent = periodEntries.reduce((sum, entry) => sum + entry.profitPercent, 0);
    const takenRr = periodEntries.reduce((sum, entry) => sum + entry.rrReal, 0);
    const averageRr = periodEntries.length > 0 ? takenRr / periodEntries.length : 0;
    const liveDeposit = accounts
      .filter((account) => ['own deposit', 'live'].includes(account.phase.trim().toLowerCase()))
      .reduce((sum, account) => sum + getAccountDisplayBalance(account), 0);
    const propPayouts = accounts.reduce((sum, account) => sum + account.payout, 0);

    return {
      closedTrades: closedTrades.length,
      wins,
      losses,
      breakeven,
      missed,
      winRate,
      totalProfitDollar,
      totalProfitPercent,
      takenRr,
      potentialRr: takenRr,
      averageRr,
      liveDeposit,
      propPayouts,
    };
  }, [accounts, periodEntries]);

  const periodLabel = useMemo(() => {
    if (statsView === 'month') {
      return `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}`;
    }

    return `Q${selectedQuarter} ${selectedYear}`;
  }, [selectedMonth, selectedQuarter, selectedYear, statsView]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...entries]
      .filter((entry) => {
        if (!query) return true;
        return (
          entry.trade.toLowerCase().includes(query) ||
          entry.account.toLowerCase().includes(query) ||
          entry.pair.toLowerCase().includes(query) ||
          outcomeLabels[entry.outcome].toLowerCase().includes(query)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [entries, search]);

  const openNewTrade = () => {
    navigate('/trades/new');
  };

  const deleteTrade = (id: string) => {
    setEntries((current) => {
      const nextEntries = deriveTrades(current.filter((entry) => entry.id !== id));
      saveTrades(nextEntries);
      return nextEntries;
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        actions={
          <>
            <ThemeToggle />
            <UserMenu />
          </>
        }
      />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Trading Journal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Journal of all created trades</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Here you see the full list of trades. To create a new one, click `Open Trade`, fill it in on its own page, and then its data will be reflected here in the journal.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="card-elevated">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Win Rate</p>
              <p className="font-mono text-2xl font-bold text-foreground">{stats.winRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{stats.winningTrades} wins / {stats.closedTrades} closed trades</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">All Trades</p>
              <p className="font-mono text-2xl font-bold text-foreground">{entries.length}</p>
              <p className="text-xs text-muted-foreground">Every row is one trade entity</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">In Progress</p>
              <p className="font-mono text-2xl font-bold text-foreground">{stats.inProgressTrades}</p>
              <p className="text-xs text-muted-foreground">Trades that are still being filled or are open</p>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="space-y-1 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">All Profit $</p>
              <p className={`font-mono text-2xl font-bold ${stats.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatSignedCurrency(stats.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">Calculated from journal trades</p>
            </CardContent>
          </Card>
        </div>

        <Card className="card-elevated overflow-hidden">
          <CardHeader className="space-y-5 border-b border-border/50 bg-gradient-to-br from-primary/10 via-background to-orange-500/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Month & Quarter Statistics</p>
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">Period performance overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This is the new summary block above the journal. It can later mirror the Notion `Month & Quarter Stat` more deeply.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-background/70 px-4 py-3 text-right shadow-sm">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Current view</p>
                <p className="text-lg font-semibold text-foreground">{periodLabel}</p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[170px_170px_170px_1fr]">
              <Select value={statsView} onValueChange={(value: 'month' | 'quarter') => setStatsView(value)}>
                <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card">
                  <SelectItem value="month">Month View</SelectItem>
                  <SelectItem value="quarter">Quarter View</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card">
                  {monthNames.map((monthName, index) => (
                    <SelectItem key={monthName} value={String(index + 1)}>
                      {monthName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center rounded-xl border border-border/60 bg-background/55 px-4 text-sm text-muted-foreground">
                {statsView === 'month' ? `Quarter preview: Q${selectedQuarter}` : `Months in quarter: ${selectedQuarter * 3 - 2}-${selectedQuarter * 3}`}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Wallet className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-wide">Live Deposit</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">${periodStats.liveDeposit.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Based on `Own deposit` and `Live` accounts</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-orange-400" />
                    <p className="text-xs uppercase tracking-wide">Prop Payouts</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">${periodStats.propPayouts.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Pulled from the current account payout totals</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarRange className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-wide">Trades | Profit</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">
                    {periodEntries.length} Trades | <span className={periodStats.totalProfitPercent >= 0 ? 'text-success' : 'text-destructive'}>{formatSignedNumber(periodStats.totalProfitPercent)}%</span>
                  </p>
                  <p className={`text-xs ${periodStats.totalProfitDollar >= 0 ? 'text-success' : 'text-destructive'}`}>{formatSignedCurrency(periodStats.totalProfitDollar)}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-wide">Position WR</p>
                  </div>
                  <p className="font-mono text-2xl font-bold text-foreground">{periodStats.winRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">{periodStats.wins} wins / {periodStats.closedTrades} closed trades</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4 text-orange-400" />
                    <p className="text-xs uppercase tracking-wide">Taken | Potential RR</p>
                  </div>
                  <p className={`font-mono text-2xl font-bold ${periodStats.takenRr >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatSignedNumber(periodStats.takenRr)}RR | {formatSignedNumber(periodStats.potentialRr)}RR
                  </p>
                  <p className="text-xs text-muted-foreground">Potential RR can be refined later when we add more trade logic</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/35 shadow-none">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hourglass className="h-4 w-4 text-primary" />
                    <p className="text-xs uppercase tracking-wide">Average RR</p>
                  </div>
                  <p className={`font-mono text-2xl font-bold ${periodStats.averageRr >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {periodStats.averageRr >= 0 ? '~' : '-~'}{Math.abs(periodStats.averageRr).toFixed(2)}RR
                  </p>
                  <p className="text-xs text-muted-foreground">Average across all trades in the selected period</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-border/50 bg-background/25 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Wins</p>
                <p className="mt-1 font-mono text-xl font-bold text-success">{periodStats.wins}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/25 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Losses</p>
                <p className="mt-1 font-mono text-xl font-bold text-destructive">{periodStats.losses}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/25 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">BE</p>
                <p className="mt-1 font-mono text-xl font-bold text-foreground">{periodStats.breakeven}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/25 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Missed</p>
                <p className="mt-1 font-mono text-xl font-bold text-muted-foreground">{periodStats.missed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-lg">Trading Journal</CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                  This is only the journal list. The detailed filling happens inside each separate trade page.
                </p>
              </div>

              <Button type="button" className="gap-2 rounded-xl px-4" onClick={openNewTrade}>
                <Plus className="h-4 w-4" />
                Open Trade
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trade, account, pair..." className="pl-9" />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {filteredEntries.length === 0 ? (
              <div className="space-y-3 p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {entries.length === 0 ? 'No trades created yet.' : 'No trades match the current search.'}
                </p>
                {entries.length === 0 && (
                  <div>
                    <Button type="button" variant="secondary" className="gap-2 rounded-xl" onClick={openNewTrade}>
                      <Plus className="h-4 w-4" />
                      Create first trade
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Trade</TableHead>
                      <TableHead className="text-xs">Account</TableHead>
                      <TableHead className="text-xs">Outcome</TableHead>
                      <TableHead className="text-xs">Pair</TableHead>
                      <TableHead className="text-xs text-right">Risk</TableHead>
                      <TableHead className="text-xs text-right">RR $</TableHead>
                      <TableHead className="text-xs text-right">All RR</TableHead>
                      <TableHead className="text-xs text-right">All Profit %</TableHead>
                      <TableHead className="text-xs text-right">All Profit $</TableHead>
                      <TableHead className="text-xs text-center">Good</TableHead>
                      <TableHead className="w-24 text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-xs">{formatTradeDate(entry.date)}</TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          <Link
                            to={`/trades/${entry.id}`}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-primary transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            {entry.trade || 'Open Trade'}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm text-foreground">{entry.account || 'Empty'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{outcomeLabels[entry.outcome]}</TableCell>
                        <TableCell className="text-sm text-foreground">{entry.pair || 'Empty'}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">${entry.risk.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${entry.rrDollar >= 0 ? 'text-success' : 'text-destructive'}`}>{formatSignedCurrency(entry.rrDollar)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${entry.allRr >= 0 ? 'text-success' : 'text-destructive'}`}>{formatSignedNumber(entry.allRr)}</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${entry.allProfitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>{formatSignedNumber(entry.allProfitPercent)}%</TableCell>
                        <TableCell className={`text-right font-mono text-xs ${entry.allProfitDollar >= 0 ? 'text-success' : 'text-destructive'}`}>{formatSignedCurrency(entry.allProfitDollar)}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">{entry.goodTrade ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button asChild type="button" variant="ghost" size="icon" className="h-8 w-8">
                              <Link to={`/trades/${entry.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-sm rounded-2xl border-border/70 bg-card">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this trade from the journal? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTrade(entry.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
