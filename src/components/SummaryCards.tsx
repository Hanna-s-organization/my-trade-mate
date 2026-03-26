import { DailyEntry } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Calendar, BarChart3, Target, Wallet, ArrowDownFromLine } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  entries: DailyEntry[];
  currentBalance: number;
  initialDeposit: number;
}

function formatUSD(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export default function SummaryCards({ entries, currentBalance, initialDeposit }: Props) {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStart = `${now.getFullYear()}-01-01`;

    const todayEntry = entries.find(e => e.date === today);
    const monthEntries = entries.filter(e => e.date >= monthStart);
    const yearEntries = entries.filter(e => e.date >= yearStart);

    const todayProfit = todayEntry?.profitAmount ?? 0;
    const todayPercent = todayEntry?.profitPercent ?? 0;

    const monthProfit = monthEntries.reduce((s, e) => s + e.profitAmount, 0);
    const monthStartBalance = monthEntries.length > 0 ? monthEntries[0].startingBalance : currentBalance;
    const monthPercent = monthStartBalance > 0 ? (monthProfit / monthStartBalance) * 100 : 0;

    const yearProfit = yearEntries.reduce((s, e) => s + e.profitAmount, 0);
    const yearStartBalance = yearEntries.length > 0 ? yearEntries[0].startingBalance : currentBalance;
    const yearPercent = yearStartBalance > 0 ? (yearProfit / yearStartBalance) * 100 : 0;

    const totalProfit = entries.reduce((s, e) => s + e.profitAmount, 0);
    const totalPercent = initialDeposit > 0 ? (totalProfit / initialDeposit) * 100 : 0;

    const totalWithdrawals = entries.reduce((s, e) => s + (e.withdrawal || 0), 0);

    return { todayProfit, todayPercent, monthProfit, monthPercent, yearProfit, yearPercent, totalProfit, totalPercent, totalWithdrawals };
  }, [entries, currentBalance, initialDeposit]);

  const balanceCards = [
    { label: 'Current Balance', value: `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: '', icon: Wallet, color: 'text-primary' },
    { label: 'Total Withdrawals', value: `$${stats.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: '', icon: ArrowDownFromLine, color: stats.totalWithdrawals > 0 ? 'text-warning' : 'text-muted-foreground' },
  ];

  const mainProfitCards = [
    { label: 'Daily Profit', value: formatUSD(stats.todayProfit), sub: formatPercent(stats.todayPercent), icon: Calendar, color: stats.todayProfit >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Monthly Profit', value: formatUSD(stats.monthProfit), sub: formatPercent(stats.monthPercent), icon: BarChart3, color: stats.monthProfit >= 0 ? 'text-success' : 'text-destructive' },
  ];

  const longTermCards = [
    { label: 'Yearly Profit', value: formatUSD(stats.yearProfit), sub: formatPercent(stats.yearPercent), icon: TrendingUp, color: stats.yearProfit >= 0 ? 'text-success' : 'text-destructive' },
    { label: 'Total Profit', value: formatUSD(stats.totalProfit), sub: formatPercent(stats.totalPercent), icon: Target, color: stats.totalProfit >= 0 ? 'text-success' : 'text-destructive' },
  ];

  const renderCard = (c: typeof balanceCards[0], i: number, large?: boolean) => (
    <Card key={i} className="animate-fade-in card-elevated" style={{ animationDelay: `${i * 60}ms` }}>
      <CardContent className={`${large ? 'p-5' : 'p-4'} space-y-2`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{c.label}</span>
          <c.icon className={`h-4 w-4 ${c.color}`} />
        </div>
        <p className={`${large ? 'text-2xl' : 'text-xl'} font-bold font-mono ${c.color}`}>{c.value}</p>
        {c.sub && <p className="text-xs font-mono text-muted-foreground">{c.sub}</p>}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Top row: main profits (large) + balance cards on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily & Monthly - prominent, left 2/3 */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mainProfitCards.map((c, i) => renderCard(c, i, true))}
        </div>
        {/* Balance & Withdrawals - right 1/3 */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {balanceCards.map((c, i) => renderCard(c, i + 2))}
        </div>
      </div>
      {/* Bottom row: yearly & total */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {longTermCards.map((c, i) => renderCard(c, i + 4))}
      </div>
    </div>
  );
}
