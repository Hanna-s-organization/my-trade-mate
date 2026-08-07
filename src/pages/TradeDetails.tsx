import { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarDays,
  Camera,
  CheckSquare,
  Clock3,
  Coins,
  CreditCard,
  DollarSign,
  Link2,
  MoveUpRight,
  Scale,
  Save,
  TimerReset,
  TrendingUp,
  Waypoints,
} from 'lucide-react';
import { Link, useBeforeUnload, useLocation, useNavigate, useParams } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import Auth from './Auth';
import { useAuth } from '@/hooks/useAuth';
import { AccountEntity, EntryByEntity, EntryTfEntity, PairEntity, SessionEntity, StyleEntity, TradeEntry } from '@/lib/types';
import { createEmptyTradeEntry, deriveTrades, loadAccounts, loadEntryBy, loadEntryTf, loadPairs, loadSessions, loadStyles, loadTrades, saveTrades, TradeOutcome } from '@/lib/trades-storage';
import { parseDecimalInput } from '@/lib/parse-decimal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const outcomeLabels: Record<TradeOutcome, string> = {
  win: 'Win',
  loss: 'Lose',
  breakeven: 'BE',
  'in-progress': 'In Progress',
  missed: 'Missed',
};

type TradeDetailsDraft = {
  date: string;
  accountId: string;
  outcome: TradeOutcome;
  pairId: string;
  risk: string;
  rrReal: string;
  rrDollar: string;
  profitPercent: string;
  profitDollar: string;
  style: string;
  session: string;
  direction: 'long' | 'short';
  entryBy: string;
  entryTf: string;
  description: string;
  emotion: string;
  timeframe1D: string;
  timeframe4H: string;
  entryNotes: string;
  exitNotes: string;
  analysis: string;
  mainTradeId: string;
  goodTrade: boolean;
};

function createDraft(trade: TradeEntry): TradeDetailsDraft {
  return {
    date: trade.date,
    accountId: trade.accountId,
    outcome: trade.outcome,
    pairId: trade.pairId,
    risk: trade.risk.toString(),
    rrReal: trade.rrReal.toString(),
    rrDollar: trade.rrDollar.toString(),
    profitPercent: trade.profitPercent.toString(),
    profitDollar: trade.profitDollar.toString(),
    style: trade.style,
    session: trade.session,
    direction: trade.direction,
    entryBy: trade.entryBy,
    entryTf: trade.entryTf,
    description: trade.description,
    emotion: trade.emotion,
    timeframe1D: trade.timeframe1D,
    timeframe4H: trade.timeframe4H,
    entryNotes: trade.entryNotes,
    exitNotes: trade.exitNotes,
    analysis: trade.analysis,
    mainTradeId: trade.mainTradeId ?? '',
    goodTrade: trade.goodTrade,
  };
}

function parseTradeDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

function formatTradeDate(value: string) {
  const parsed = parseTradeDate(value);
  return parsed ? format(parsed, 'dd/MM/yyyy') : value;
}

function computeDerivedMetrics({
  risk,
  rrDollar,
  deposit,
}: {
  risk: number;
  rrDollar: number;
  deposit: number;
}) {
  const rrReal = risk !== 0 ? rrDollar / risk : 0;
  const profitDollar = rrDollar;
  const profitPercent = deposit !== 0 ? (profitDollar / deposit) * 100 : 0;

  return {
    rrReal,
    profitDollar,
    profitPercent,
  };
}

function getAccountDisplayBalance(account: AccountEntity) {
  return account.currentBalance > 0 ? account.currentBalance : account.startingBalance;
}

function NotionPropertyRow({
  label,
  children,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border/40 py-3 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex h-5 w-5 items-center justify-center text-muted-foreground/80">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TradeNoteCard({
  title,
  value,
  onChange,
}: {
  title: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <div className="rounded-[22px] border border-border/60 bg-card/80 p-5 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
      <p className="mb-4 text-xl font-medium italic tracking-tight text-foreground">{title}</p>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Write here..."
        className="min-h-[132px] resize-none rounded-2xl border-border/50 bg-background/40 text-base"
      />
    </div>
  );
}

export default function TradeDetailsPage() {
  const { user, loading } = useAuth();
  const { tradeId } = useParams<{ tradeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isNewTrade = location.pathname === '/trades/new';
  const [accounts, setAccounts] = useState<AccountEntity[]>([]);
  const [pairs, setPairs] = useState<PairEntity[]>([]);
  const [styles, setStyles] = useState<StyleEntity[]>([]);
  const [sessions, setSessions] = useState<SessionEntity[]>([]);
  const [entryByItems, setEntryByItems] = useState<EntryByEntity[]>([]);
  const [entryTfItems, setEntryTfItems] = useState<EntryTfEntity[]>([]);
  const [entries, setEntries] = useState<TradeEntry[]>([]);
  const [draft, setDraft] = useState<null | TradeDetailsDraft>(null);
  const [initialDraftSnapshot, setInitialDraftSnapshot] = useState('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const allowNavigationRef = useRef(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    setAccounts(loadAccounts());
    setPairs(loadPairs());
    setStyles(loadStyles());
    setSessions(loadSessions());
    setEntryByItems(loadEntryBy());
    setEntryTfItems(loadEntryTf());
    const nextEntries = loadTrades();
    setEntries(nextEntries);
    if (isNewTrade) {
      const emptyDraft = createDraft(createEmptyTradeEntry());
      setDraft(emptyDraft);
      setInitialDraftSnapshot(JSON.stringify(emptyDraft));
      return;
    }

    const currentTrade = nextEntries.find((entry) => entry.id === tradeId);
    const nextDraft = currentTrade ? createDraft(currentTrade) : null;
    setDraft(nextDraft);
    setInitialDraftSnapshot(nextDraft ? JSON.stringify(nextDraft) : '');
  }, [isNewTrade, tradeId]);

  const trade = useMemo(() => entries.find((entry) => entry.id === tradeId) ?? null, [entries, tradeId]);
  const availableMainTrades = useMemo(() => entries.filter((entry) => entry.id !== tradeId), [entries, tradeId]);
  const currentSubTrades = useMemo(() => entries.filter((entry) => entry.mainTradeId === tradeId), [entries, tradeId]);
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === draft?.accountId) ?? null,
    [accounts, draft?.accountId],
  );
  const derivedMetrics = useMemo(() => {
    const risk = parseDecimalInput(draft?.risk || '0') || 0;
    const rrDollar = parseDecimalInput(draft?.rrDollar || '0') || 0;
    const deposit = selectedAccount?.startingBalance ?? 0;

    return computeDerivedMetrics({
      risk,
      rrDollar,
      deposit,
    });
  }, [draft?.risk, draft?.rrDollar, selectedAccount?.startingBalance]);
  const hasUnsavedChanges = useMemo(() => {
    if (!draft || !initialDraftSnapshot) return false;
    return JSON.stringify(draft) !== initialDraftSnapshot;
  }, [draft, initialDraftSnapshot]);

  useBeforeUnload(
    (event) => {
      if (!hasUnsavedChanges || allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    },
    { capture: true },
  );

  useEffect(() => {
    if (!hasUnsavedChanges || allowNavigationRef.current) return;

    const handlePopState = () => {
      pendingNavigationRef.current = () => navigate('/trades');
      setLeaveDialogOpen(true);
      window.history.pushState({ tradeGuard: true }, '', window.location.href);
    };

    window.history.pushState({ tradeGuard: true }, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges, navigate]);

  const requestLeave = (action: () => void) => {
    if (!hasUnsavedChanges || allowNavigationRef.current) {
      action();
      return;
    }

    pendingNavigationRef.current = action;
    setLeaveDialogOpen(true);
  };

  const confirmLeave = () => {
    allowNavigationRef.current = true;
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setLeaveDialogOpen(false);
    action?.();
  };

  const stayOnPage = () => {
    pendingNavigationRef.current = null;
    setLeaveDialogOpen(false);
  };

  const saveDetails = () => {
    if (!draft) return;

    const selectedPair = pairs.find((pair) => pair.id === draft.pairId);
    const baseTrade = isNewTrade ? createEmptyTradeEntry() : trade;
    if (!baseTrade) return;

    const nextTrade: TradeEntry = {
      ...baseTrade,
      date: draft.date,
      account: selectedAccount?.name ?? '',
      accountId: selectedAccount?.id ?? '',
      outcome: draft.outcome,
      pairId: selectedPair?.id ?? '',
      pair: selectedPair?.name ?? '',
      risk: parseDecimalInput(draft.risk || '0') || 0,
      rrReal: derivedMetrics.rrReal,
      rrDollar: parseDecimalInput(draft.rrDollar || '0') || 0,
      profitPercent: derivedMetrics.profitPercent,
      profitDollar: derivedMetrics.profitDollar,
      style: draft.style.trim(),
      session: draft.session.trim(),
      direction: draft.direction,
      entryBy: draft.entryBy.trim(),
      entryTf: draft.entryTf.trim(),
      description: draft.description.trim(),
      emotion: draft.emotion.trim(),
      timeframe1D: draft.timeframe1D.trim(),
      timeframe4H: draft.timeframe4H.trim(),
      entryNotes: draft.entryNotes.trim(),
      exitNotes: draft.exitNotes.trim(),
      analysis: draft.analysis.trim(),
      mainTradeId: draft.mainTradeId || null,
      goodTrade: draft.goodTrade,
      strategy: baseTrade.strategy,
      profitLoss: derivedMetrics.profitDollar,
      updatedAt: new Date().toISOString(),
    };

    const nextEntries = deriveTrades(
      isNewTrade
        ? [nextTrade, ...entries]
        : entries.map((entry) => (entry.id === baseTrade.id ? nextTrade : entry)),
    );
    setEntries(nextEntries);
    saveTrades(nextEntries);
    const nextDraft = createDraft(nextEntries.find((entry) => entry.id === nextTrade.id) ?? nextTrade);
    setDraft(nextDraft);
    setInitialDraftSnapshot(JSON.stringify(nextDraft));
    allowNavigationRef.current = true;
    navigate('/trades');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Auth />;

  if ((!trade && !isNewTrade) || !draft) {
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
        <main className="container mx-auto px-4 py-10">
          <Card className="card-elevated max-w-2xl">
            <CardContent className="space-y-4 p-6">
              <p className="text-lg font-semibold text-foreground">Trade not found</p>
              <Button asChild>
                <Link to="/trades">Back to Trading Journal</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

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

      <main className="container mx-auto max-w-6xl space-y-8 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="h-auto justify-start gap-2 px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => requestLeave(() => navigate('/trades'))}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Trading Journal
            </Button>
            <h1 className="text-5xl font-semibold tracking-tight text-foreground">Trade</h1>
            <p className="text-sm text-muted-foreground">This page mirrors the Notion trade structure first, and then we will connect the rest of the logic step by step.</p>
          </div>

          <Button type="button" className="gap-2 rounded-xl px-5" onClick={saveDetails}>
            <Save className="h-4 w-4" />
            Save Trade
          </Button>
        </div>

        <section className="space-y-1">
          <p className="text-sm font-semibold text-primary">For Trader</p>

          <div className="rounded-[28px] border border-border/60 bg-card/85 px-5 py-3 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.9)]">
            <NotionPropertyRow label="Date" icon={<CalendarDays className="h-4 w-4" />}>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      'h-11 w-full justify-between rounded-xl px-3 font-mono text-left text-base font-medium text-foreground hover:bg-background/50 md:max-w-[280px]',
                      !draft.date && 'text-muted-foreground',
                    )}
                  >
                    <span>{draft.date ? formatTradeDate(draft.date) : 'Select date'}</span>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto rounded-2xl border-border/70 bg-card p-3">
                  <Calendar
                    mode="single"
                    selected={parseTradeDate(draft.date)}
                    month={parseTradeDate(draft.date)}
                    onSelect={(date) => {
                      if (!date) return;
                      setDraft((current) => (current ? { ...current, date: format(date, 'yyyy-MM-dd') } : current));
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </NotionPropertyRow>

            <NotionPropertyRow label="Account" icon={<CreditCard className="h-4 w-4" />}>
              <Select value={draft.accountId || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, accountId: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-auto min-h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[420px]">
                  {selectedAccount ? (
                    <div className="flex min-w-0 items-center gap-3 pr-6 text-left">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background/60 text-xs font-semibold text-foreground">
                        {selectedAccount.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">{selectedAccount.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          Balance / ${getAccountDisplayBalance(selectedAccount).toFixed(2)} / ${selectedAccount.payout.toFixed(2)}
                        </div>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {selectedAccount.phase}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Link or create a page..." />
                  )}
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <div className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">Select a page</div>
                  <SelectItem value="none" className="rounded-xl py-3">
                    <span className="text-sm text-muted-foreground">Empty</span>
                  </SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id} className="rounded-xl py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-background/60 text-xs font-semibold text-foreground">
                          {account.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-foreground">{account.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            Balance / ${getAccountDisplayBalance(account).toFixed(2)} / ${account.payout.toFixed(2)}
                          </div>
                        </div>
                        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {account.phase}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Outcome" icon={<Link2 className="h-4 w-4" />}>
              <Select value={draft.outcome} onValueChange={(value: TradeOutcome) => setDraft((current) => (current ? { ...current, outcome: value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectGroup>
                    <SelectLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">To-do</SelectLabel>
                    <SelectItem value="missed" className="rounded-xl py-2 text-base">{outcomeLabels.missed}</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">In progress</SelectLabel>
                    <SelectItem value="in-progress" className="rounded-xl py-2 text-base">{outcomeLabels['in-progress']}</SelectItem>
                  </SelectGroup>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Complete</SelectLabel>
                    <SelectItem value="breakeven" className="rounded-xl py-2 text-base">{outcomeLabels.breakeven}</SelectItem>
                    <SelectItem value="loss" className="rounded-xl py-2 text-base">{outcomeLabels.loss}</SelectItem>
                    <SelectItem value="win" className="rounded-xl py-2 text-base">{outcomeLabels.win}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Risk ($)" icon={<Scale className="h-4 w-4" />}>
              <Input
                value={draft.risk}
                onChange={(event) => setDraft((current) => (current ? { ...current, risk: event.target.value } : current))}
                placeholder="Empty"
                className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]"
              />
            </NotionPropertyRow>

            <NotionPropertyRow label="RR | $ (Result)" icon={<Coins className="h-4 w-4" />}>
              <Input
                value={draft.rrDollar}
                onChange={(event) => setDraft((current) => (current ? { ...current, rrDollar: event.target.value } : current))}
                placeholder="Empty"
                className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]"
              />
            </NotionPropertyRow>

            <NotionPropertyRow label="Pair" icon={<Camera className="h-4 w-4" />}>
              <Select value={draft.pairId || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, pairId: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[280px]">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="none" className="rounded-xl py-2 text-base">Empty</SelectItem>
                  {pairs.map((pair) => (
                    <SelectItem key={pair.id} value={pair.id} className="rounded-xl py-2 text-base">
                      {pair.name}
                      {pair.note ? ` -> ${pair.note}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Style" icon={<ArrowLeft className="h-4 w-4" />}>
              <Select value={draft.style || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, style: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[320px]">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="none" className="rounded-xl py-2 text-base">Empty</SelectItem>
                  {styles.map((style) => (
                    <SelectItem key={style.id} value={style.name} className="rounded-xl py-2 text-base">
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Session" icon={<Clock3 className="h-4 w-4" />}>
              <Select value={draft.session || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, session: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[320px]">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="none" className="rounded-xl py-2 text-base">Empty</SelectItem>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.name} className="rounded-xl py-2 text-base">
                      <div className="flex min-w-0 items-center justify-between gap-4">
                        <span>{session.name}</span>
                        <span className="text-xs text-muted-foreground">{session.timeRange}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Direction" icon={<ArrowRightLeft className="h-4 w-4" />}>
              <Select value={draft.direction} onValueChange={(value: 'long' | 'short') => setDraft((current) => (current ? { ...current, direction: value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="long" className="rounded-xl py-2 text-base">Long</SelectItem>
                  <SelectItem value="short" className="rounded-xl py-2 text-base">Short</SelectItem>
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Entry By" icon={<Waypoints className="h-4 w-4" />}>
              <Select value={draft.entryBy || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, entryBy: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[320px]">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="none" className="rounded-xl py-2 text-base">Empty</SelectItem>
                  {entryByItems.map((entryBy) => (
                    <SelectItem key={entryBy.id} value={entryBy.name} className="rounded-xl py-2 text-base">
                      {entryBy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="Entry TF" icon={<TimerReset className="h-4 w-4" />}>
              <Select value={draft.entryTf || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, entryTf: value === 'none' ? '' : value } : current))}>
                <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                  <SelectItem value="none" className="rounded-xl py-2 text-base">Empty</SelectItem>
                  {entryTfItems.map((entryTf) => (
                    <SelectItem key={entryTf.id} value={entryTf.name} className="rounded-xl py-2 text-base">
                      {entryTf.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NotionPropertyRow>

            <NotionPropertyRow label="RR Real" icon={<MoveUpRight className="h-4 w-4" />}>
              <Input
                value={derivedMetrics.rrReal.toFixed(2)}
                readOnly
                className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]"
              />
            </NotionPropertyRow>

            <NotionPropertyRow label="Profit %" icon={<TrendingUp className="h-4 w-4" />}>
              <Input
                value={derivedMetrics.profitPercent.toFixed(2)}
                readOnly
                className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]"
              />
            </NotionPropertyRow>

            <NotionPropertyRow label="Profit $" icon={<DollarSign className="h-4 w-4" />}>
              <Input
                value={derivedMetrics.profitDollar.toFixed(2)}
                readOnly
                className="h-11 rounded-xl border-border/50 bg-background/30 md:max-w-[220px]"
              />
            </NotionPropertyRow>

            <NotionPropertyRow label="Good Trade?" icon={<CheckSquare className="h-4 w-4" />}>
              <label className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/20 px-3 py-2 md:max-w-[220px]">
                <Checkbox
                  checked={draft.goodTrade}
                  onCheckedChange={(checked) => setDraft((current) => (current ? { ...current, goodTrade: checked === true } : current))}
                />
                <span className="text-sm text-foreground">{draft.goodTrade ? 'Checked' : 'Unchecked'}</span>
              </label>
            </NotionPropertyRow>

          </div>
        </section>

        <section className="space-y-5">
          <div className="space-y-4 rounded-[28px] border border-border/60 bg-card/85 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.9)]">
            <div>
              <p className="text-sm font-semibold text-foreground">Relations</p>
              <div className="mt-3 inline-flex items-center rounded-xl border border-dashed border-border/60 bg-background/25 px-4 py-3 text-sm text-muted-foreground">
                Add Analysis
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Linked Trade</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <Select value={draft.mainTradeId || 'none'} onValueChange={(value) => setDraft((current) => (current ? { ...current, mainTradeId: value === 'none' ? '' : value } : current))}>
                  <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30">
                    <SelectValue placeholder="No main trade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                    <SelectItem value="none" className="rounded-xl py-2 text-base">No main trade</SelectItem>
                    {availableMainTrades.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id} className="rounded-xl py-2 text-base">
                        {entry.trade || entry.pair || 'Trade'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="rounded-xl border border-border/50 bg-background/20 px-4 py-3 text-sm text-muted-foreground">
                  {currentSubTrades.length === 0 ? 'No sub trades linked yet.' : currentSubTrades.map((entry) => entry.trade || entry.pair || 'Trade').join(', ')}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">Comments</p>
              <Textarea
                value={draft.analysis}
                onChange={(event) => setDraft((current) => (current ? { ...current, analysis: event.target.value } : current))}
                placeholder="Add a comment..."
                className="mt-3 min-h-[92px] rounded-2xl border-border/50 bg-background/30"
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <TradeNoteCard title="Description" value={draft.description} onChange={(nextValue) => setDraft((current) => (current ? { ...current, description: nextValue } : current))} />
            <TradeNoteCard title="1D" value={draft.timeframe1D} onChange={(nextValue) => setDraft((current) => (current ? { ...current, timeframe1D: nextValue } : current))} />
            <TradeNoteCard title="4H" value={draft.timeframe4H} onChange={(nextValue) => setDraft((current) => (current ? { ...current, timeframe4H: nextValue } : current))} />
            <TradeNoteCard title="Emotion" value={draft.emotion} onChange={(nextValue) => setDraft((current) => (current ? { ...current, emotion: nextValue } : current))} />
            <TradeNoteCard title="Entry" value={draft.entryNotes} onChange={(nextValue) => setDraft((current) => (current ? { ...current, entryNotes: nextValue } : current))} />
            <TradeNoteCard title="Exit" value={draft.exitNotes} onChange={(nextValue) => setDraft((current) => (current ? { ...current, exitNotes: nextValue } : current))} />
          </div>
        </section>
      </main>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent className="max-w-md rounded-2xl border-border/70 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave? This trade has unsaved changes and they will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={stayOnPage}>Stay</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmLeave}
            >
              Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
