import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import Auth from './Auth';
import { useAuth } from '@/hooks/useAuth';
import { TradeEntry } from '@/lib/types';
import { deriveTrades, loadTrades, saveTrades, TradeOutcome } from '@/lib/trades-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function TradesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TradeEntry[]>(() => loadTrades());
  const [search, setSearch] = useState('');

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
