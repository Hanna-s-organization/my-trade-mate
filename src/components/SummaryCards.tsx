import { DailyEntry } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  TrendingUp,
  Calendar,
  BarChart3,
  Target,
  Wallet,
  ArrowDownFromLine,
  ChevronDown,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
  entries: DailyEntry[];
  currentBalance: number;
  initialDeposit: number;
  showBalance: boolean;
  showProfitAmounts: boolean;
}

function formatUSD(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function maskValue() {
  return '••••••';
}

function Sparkline({
  values,
  colorClass,
}: {
  values: number[];
  colorClass: string;
}) {
  if (values.length < 2) return null;

  const width = 120;
  const height = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = index * stepX;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="pt-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={`h-9 w-full max-w-[120px] ${colorClass}`}
        aria-hidden="true"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          opacity="0.95"
        />
      </svg>
    </div>
  );
}

export default function SummaryCards({
  entries,
  currentBalance,
  initialDeposit,
  showBalance,
  showProfitAmounts,
}: Props) {
  const [showLongTermProfits, setShowLongTermProfits] = useState(true);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = (now.getDay() + 6) % 7;
    const weekStartDate = new Date(now);
    weekStartDate.setDate(now.getDate() - dayOfWeek);
    const weekStart = weekStartDate.toISOString().split('T')[0];
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStart = `${now.getFullYear()}-01-01`;

    const todayEntry = entries.find((entry) => entry.date === today);
    const weekEntries = entries.filter((entry) => entry.date >= weekStart);
    const monthEntries = entries.filter((entry) => entry.date >= monthStart);
    const yearEntries = entries.filter((entry) => entry.date >= yearStart);

    const todayProfit = todayEntry?.profitAmount ?? 0;
    const todayPercent = todayEntry?.profitPercent ?? 0;

    const weekProfit = weekEntries.reduce((sum, entry) => sum + entry.profitAmount, 0);
    const weekStartBalance = weekEntries.length > 0 ? weekEntries[0].startingBalance : currentBalance;
    const weekPercent = weekStartBalance > 0 ? (weekProfit / weekStartBalance) * 100 : 0;

    const monthProfit = monthEntries.reduce((sum, entry) => sum + entry.profitAmount, 0);
    const monthStartBalance = monthEntries.length > 0 ? monthEntries[0].startingBalance : currentBalance;
    const monthPercent = monthStartBalance > 0 ? (monthProfit / monthStartBalance) * 100 : 0;

    const yearProfit = yearEntries.reduce((sum, entry) => sum + entry.profitAmount, 0);
    const yearStartBalance = yearEntries.length > 0 ? yearEntries[0].startingBalance : currentBalance;
    const yearPercent = yearStartBalance > 0 ? (yearProfit / yearStartBalance) * 100 : 0;

    const totalProfit = entries.reduce((sum, entry) => sum + entry.profitAmount, 0);
    const totalPercent = initialDeposit > 0 ? (totalProfit / initialDeposit) * 100 : 0;
    const totalWithdrawals = entries.reduce((sum, entry) => sum + (entry.withdrawal || 0), 0);

    return {
      todayProfit,
      todayPercent,
      weekProfit,
      weekPercent,
      monthProfit,
      monthPercent,
      yearProfit,
      yearPercent,
      totalProfit,
      totalPercent,
      totalWithdrawals,
    };
  }, [entries, currentBalance, initialDeposit]);

  const sparklineData = useMemo(() => {
    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const dailyValues = sortedEntries.slice(-7).map((entry) => entry.profitAmount);

    const weeklyMap = new Map<string, number>();
    sortedEntries.forEach((entry) => {
      const date = new Date(`${entry.date}T00:00:00`);
      const weekStartDate = new Date(date);
      const dayOfWeek = (date.getDay() + 6) % 7;
      weekStartDate.setDate(date.getDate() - dayOfWeek);
      const weekKey = weekStartDate.toISOString().split('T')[0];

      weeklyMap.set(weekKey, (weeklyMap.get(weekKey) ?? 0) + entry.profitAmount);
    });

    const weeklyValues = Array.from(weeklyMap.values()).slice(-6);

    return { dailyValues, weeklyValues };
  }, [entries]);

  const balanceCards = [
    {
      label: 'Current Balance',
      value: showBalance
        ? `$${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : maskValue(),
      sub: '',
      icon: Wallet,
      color: 'text-warning',
    },
    {
      label: 'Total Withdrawals',
      value: showBalance
        ? `$${stats.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : maskValue(),
      sub: '',
      icon: ArrowDownFromLine,
      color: 'text-warning',
    },
  ];

  const mainProfitCards = [
    {
      label: 'Daily Profit',
      value: showProfitAmounts ? formatUSD(stats.todayProfit) : maskValue(),
      sub: formatPercent(stats.todayPercent),
      icon: Calendar,
      color: stats.todayProfit >= 0 ? 'text-success' : 'text-destructive',
    },
    {
      label: 'Weekly Profit',
      value: showProfitAmounts ? formatUSD(stats.weekProfit) : maskValue(),
      sub: formatPercent(stats.weekPercent),
      icon: BarChart3,
      color: stats.weekProfit >= 0 ? 'text-success' : 'text-destructive',
    },
  ];

  const longTermCards = [
    {
      label: 'Monthly Profit',
      value: showProfitAmounts ? formatUSD(stats.monthProfit) : maskValue(),
      sub: formatPercent(stats.monthPercent),
      icon: BarChart3,
      color: stats.monthProfit >= 0 ? 'text-success' : 'text-destructive',
    },
    {
      label: 'Yearly Profit',
      value: showProfitAmounts ? formatUSD(stats.yearProfit) : maskValue(),
      sub: formatPercent(stats.yearPercent),
      icon: TrendingUp,
      color: stats.yearProfit >= 0 ? 'text-success' : 'text-destructive',
    },
    {
      label: 'Total Profit',
      value: showProfitAmounts ? formatUSD(stats.totalProfit) : maskValue(),
      sub: formatPercent(stats.totalPercent),
      icon: Target,
      color: stats.totalProfit >= 0 ? 'text-success' : 'text-destructive',
    },
  ];

  const renderCard = (
    card: typeof balanceCards[0],
    index: number,
    large?: boolean,
    sparklineValues?: number[],
  ) => (
    <Card
      key={index}
      className="animate-fade-in card-elevated"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardContent className={`${large ? 'p-5' : 'p-4'} space-y-2`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {card.label}
          </span>
          <card.icon className={`h-4 w-4 ${card.color}`} />
        </div>
        <p
          className={`${large ? 'text-2xl' : 'text-xl'} font-bold font-mono ${
            card.sub ? 'text-foreground' : card.label === 'Current Balance' || card.label === 'Total Withdrawals' ? 'text-foreground' : card.color
          }`}
        >
          {card.value}
        </p>
        {card.sub && <p className={`text-sm font-mono ${card.color}`}>{card.sub}</p>}
        {sparklineValues && sparklineValues.length > 1 && (
          <Sparkline values={sparklineValues} colorClass={card.color} />
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mainProfitCards.map((card, index) =>
            renderCard(
              card,
              index,
              true,
              index === 0 ? sparklineData.dailyValues : sparklineData.weeklyValues,
            ),
          )}
        </div>
        <div className="rounded-2xl border border-warning/25 bg-warning/8 p-3 shadow-[0_0_0_1px_rgba(255,166,77,0.08)]">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-semibold text-foreground">Balance snapshot</p>
              <p className="text-xs text-muted-foreground">Your core account totals</p>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {balanceCards.map((card, index) => renderCard(card, index + 2))}
          </div>
        </div>
      </div>

      <Collapsible open={showLongTermProfits} onOpenChange={setShowLongTermProfits} className="space-y-3">
        <div className="rounded-2xl border bg-card/70 px-4 py-3">
          <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 text-left">
            <div>
              <p className="text-sm font-semibold text-foreground">Long-term profit</p>
              <p className="text-xs text-muted-foreground">Monthly, yearly and total performance</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{showLongTermProfits ? 'Collapse' : 'Expand'}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showLongTermProfits ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {longTermCards.map((card, index) => renderCard(card, index + 4))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
