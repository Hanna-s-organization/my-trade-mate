import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Database, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import Auth from './Auth';
import { parseDecimalInput } from '@/lib/parse-decimal';
import { AccountEntity, EntryByEntity, EntryTfEntity, PairEntity, SessionEntity, StyleEntity, TradeEntry } from '@/lib/types';
import {
  createAccountId,
  createEntryById,
  createEntryTfId,
  createPairId,
  createSessionId,
  createStyleId,
  loadAccounts,
  loadEntryBy,
  loadEntryTf,
  loadPairs,
  loadSessions,
  loadStyles,
  loadTrades,
  saveAccounts,
  saveEntryBy,
  saveEntryTf,
  savePairs,
  saveSessions,
  saveStyles,
} from '@/lib/trades-storage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AccountDraft = {
  name: string;
  startingBalance: string;
  currentBalance: string;
  payout: string;
  phase: string;
};

type PairDraft = {
  name: string;
  isMainPair: boolean;
};

type StyleDraft = {
  name: string;
};

type SessionDraft = {
  name: string;
  timeRange: string;
};

type EntryByDraft = {
  name: string;
};

type EntryTfDraft = {
  name: string;
};

type PairDerivedState = {
  linkedTrades: TradeEntry[];
  rrTotal: number;
  winRate: number;
  mainPairShow: string;
  biasWr: null | number;
  biasWrText: string;
  biasPositionText: string;
  everydayAnalysisCount: number;
};

const emptyAccountDraft = (): AccountDraft => ({
  name: '',
  startingBalance: '',
  currentBalance: '',
  payout: '',
  phase: '',
});

const emptyPairDraft = (): PairDraft => ({
  name: '',
  isMainPair: false,
});

const emptyStyleDraft = (): StyleDraft => ({
  name: '',
});

const emptySessionDraft = (): SessionDraft => ({
  name: '',
  timeRange: '',
});

const emptyEntryByDraft = (): EntryByDraft => ({
  name: '',
});

const emptyEntryTfDraft = (): EntryTfDraft => ({
  name: '',
});

function formatCurrency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function parseMoneyInput(value: string) {
  return parseDecimalInput(value || '0') || 0;
}

function buildAccountStats(account: AccountEntity, trades: TradeEntry[]) {
  const linkedTrades = trades.filter((trade) => trade.accountId === account.id);
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    linkedTrades,
    winRate,
  };
}

function buildPairStats(pair: PairEntity, trades: TradeEntry[]): PairDerivedState {
  const linkedTrades = trades.filter((trade) => trade.pairId === pair.id);
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
  const rrTotal = linkedTrades.reduce((sum, trade) => sum + trade.rrReal, 0);

  return {
    linkedTrades,
    rrTotal,
    winRate,
    mainPairShow: pair.isMainPair ? 'Main Pair' : '',
    biasWr: null,
    biasWrText: 'Pending Everyday Analysis',
    biasPositionText: 'Pending Everyday Analysis',
    everydayAnalysisCount: 0,
  };
}

function buildStyleStats(style: StyleEntity, trades: TradeEntry[]) {
  const linkedTrades = trades.filter((trade) => trade.style.trim().toLowerCase() === style.name.trim().toLowerCase());
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    linkedTrades,
    winRate,
  };
}

function buildSessionStats(session: SessionEntity, trades: TradeEntry[]) {
  const linkedTrades = trades.filter((trade) => trade.session.trim().toLowerCase() === session.name.trim().toLowerCase());
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    linkedTrades,
    winRate,
  };
}

function buildEntryByStats(entryBy: EntryByEntity, trades: TradeEntry[]) {
  const linkedTrades = trades.filter((trade) => trade.entryBy.trim().toLowerCase() === entryBy.name.trim().toLowerCase());
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    linkedTrades,
    winRate,
  };
}

function buildEntryTfStats(entryTf: EntryTfEntity, trades: TradeEntry[]) {
  const linkedTrades = trades.filter((trade) => trade.entryTf.trim().toLowerCase() === entryTf.name.trim().toLowerCase());
  const closedTrades = linkedTrades.filter((trade) => trade.outcome === 'win' || trade.outcome === 'loss' || trade.outcome === 'breakeven');
  const wins = linkedTrades.filter((trade) => trade.outcome === 'win').length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  return {
    linkedTrades,
    winRate,
  };
}

// TODO: Add the remaining linked databases for Accounts (Payout, Trade Stat, richer relations) in a later pass.
// TODO: Wire Pairs to the future Everyday Analysis database so BIAS WR, BIAS WR text, and BIAS Position text calculate automatically like in Notion.

function ReadonlyField({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <div
        className={`flex min-h-12 items-center rounded-xl border border-border/60 bg-background/30 px-4 py-3 text-sm ${
          muted ? 'text-muted-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function NotionPropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-b border-border/40 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
      <div className="text-base text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default function DatabasePage() {
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<AccountEntity[]>([]);
  const [pairs, setPairs] = useState<PairEntity[]>([]);
  const [styles, setStyles] = useState<StyleEntity[]>([]);
  const [sessions, setSessions] = useState<SessionEntity[]>([]);
  const [entryByItems, setEntryByItems] = useState<EntryByEntity[]>([]);
  const [entryTfItems, setEntryTfItems] = useState<EntryTfEntity[]>([]);
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [accountDraft, setAccountDraft] = useState<AccountDraft>(emptyAccountDraft);
  const [editingAccountId, setEditingAccountId] = useState<null | string>(null);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [pairDraft, setPairDraft] = useState<PairDraft>(emptyPairDraft);
  const [editingPairId, setEditingPairId] = useState<null | string>(null);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [pairMoreOpen, setPairMoreOpen] = useState(false);
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(emptyStyleDraft);
  const [editingStyleId, setEditingStyleId] = useState<null | string>(null);
  const [styleDialogOpen, setStyleDialogOpen] = useState(false);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>(emptySessionDraft);
  const [editingSessionId, setEditingSessionId] = useState<null | string>(null);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [entryByDraft, setEntryByDraft] = useState<EntryByDraft>(emptyEntryByDraft);
  const [editingEntryById, setEditingEntryById] = useState<null | string>(null);
  const [entryByDialogOpen, setEntryByDialogOpen] = useState(false);
  const [entryTfDraft, setEntryTfDraft] = useState<EntryTfDraft>(emptyEntryTfDraft);
  const [editingEntryTfId, setEditingEntryTfId] = useState<null | string>(null);
  const [entryTfDialogOpen, setEntryTfDialogOpen] = useState(false);

  useEffect(() => {
    setAccounts(loadAccounts());
    setPairs(loadPairs());
    setStyles(loadStyles());
    setSessions(loadSessions());
    setEntryByItems(loadEntryBy());
    setEntryTfItems(loadEntryTf());
    setTrades(loadTrades());
  }, []);

  useEffect(() => {
    if (accounts.length > 0) {
      saveAccounts(accounts);
    }
  }, [accounts]);

  useEffect(() => {
    if (pairs.length > 0) {
      savePairs(pairs);
    }
  }, [pairs]);

  useEffect(() => {
    if (styles.length > 0) {
      saveStyles(styles);
    }
  }, [styles]);

  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  useEffect(() => {
    if (entryByItems.length > 0) {
      saveEntryBy(entryByItems);
    }
  }, [entryByItems]);

  useEffect(() => {
    if (entryTfItems.length > 0) {
      saveEntryTf(entryTfItems);
    }
  }, [entryTfItems]);

  const clearAccountDraft = () => {
    setAccountDraft(emptyAccountDraft());
    setEditingAccountId(null);
  };

  const clearPairDraft = () => {
    setPairDraft(emptyPairDraft());
    setEditingPairId(null);
    setPairMoreOpen(false);
  };

  const clearStyleDraft = () => {
    setStyleDraft(emptyStyleDraft());
    setEditingStyleId(null);
  };

  const clearSessionDraft = () => {
    setSessionDraft(emptySessionDraft());
    setEditingSessionId(null);
  };

  const clearEntryByDraft = () => {
    setEntryByDraft(emptyEntryByDraft());
    setEditingEntryById(null);
  };

  const clearEntryTfDraft = () => {
    setEntryTfDraft(emptyEntryTfDraft());
    setEditingEntryTfId(null);
  };

  const openCreateAccountDialog = () => {
    clearAccountDraft();
    setAccountDialogOpen(true);
  };

  const openEditAccountDialog = (account: AccountEntity) => {
    setEditingAccountId(account.id);
    setAccountDraft({
      name: account.name,
      startingBalance: account.startingBalance.toString(),
      currentBalance: account.currentBalance.toString(),
      payout: account.payout.toString(),
      phase: account.phase,
    });
    setAccountDialogOpen(true);
  };

  const openCreatePairDialog = () => {
    clearPairDraft();
    setPairDialogOpen(true);
  };

  const openEditPairDialog = (pair: PairEntity) => {
    setEditingPairId(pair.id);
    setPairDraft({
      name: pair.name,
      isMainPair: pair.isMainPair,
    });
    setPairDialogOpen(true);
  };

  const openCreateStyleDialog = () => {
    clearStyleDraft();
    setStyleDialogOpen(true);
  };

  const openEditStyleDialog = (style: StyleEntity) => {
    setEditingStyleId(style.id);
    setStyleDraft({
      name: style.name,
    });
    setStyleDialogOpen(true);
  };

  const openCreateSessionDialog = () => {
    clearSessionDraft();
    setSessionDialogOpen(true);
  };

  const openEditSessionDialog = (session: SessionEntity) => {
    setEditingSessionId(session.id);
    setSessionDraft({
      name: session.name,
      timeRange: session.timeRange,
    });
    setSessionDialogOpen(true);
  };

  const openCreateEntryByDialog = () => {
    clearEntryByDraft();
    setEntryByDialogOpen(true);
  };

  const openEditEntryByDialog = (entryBy: EntryByEntity) => {
    setEditingEntryById(entryBy.id);
    setEntryByDraft({
      name: entryBy.name,
    });
    setEntryByDialogOpen(true);
  };

  const openCreateEntryTfDialog = () => {
    clearEntryTfDraft();
    setEntryTfDialogOpen(true);
  };

  const openEditEntryTfDialog = (entryTf: EntryTfEntity) => {
    setEditingEntryTfId(entryTf.id);
    setEntryTfDraft({
      name: entryTf.name,
    });
    setEntryTfDialogOpen(true);
  };

  const isAccountValid = accountDraft.name.trim();
  const isPairValid = pairDraft.name.trim();
  const isStyleValid = styleDraft.name.trim();
  const isSessionValid = sessionDraft.name.trim();
  const isEntryByValid = entryByDraft.name.trim();
  const isEntryTfValid = entryTfDraft.name.trim();

  const saveAccount = () => {
    if (!isAccountValid) return;

    const normalizedName = accountDraft.name.trim();
    const nextAccount: AccountEntity = {
      id: editingAccountId ?? createAccountId(normalizedName),
      name: normalizedName,
      startingBalance: parseMoneyInput(accountDraft.startingBalance),
      currentBalance: parseMoneyInput(accountDraft.currentBalance || accountDraft.startingBalance),
      payout: parseMoneyInput(accountDraft.payout),
      phase: accountDraft.phase.trim() || 'Phase One',
      note: '',
      createdAt:
        editingAccountId
          ? accounts.find((account) => account.id === editingAccountId)?.createdAt ?? new Date().toISOString()
          : new Date().toISOString(),
    };

    setAccounts((current) => {
      if (editingAccountId) {
        return current.map((account) => (account.id === editingAccountId ? nextAccount : account));
      }
      return [...current, nextAccount];
    });

    clearAccountDraft();
    setAccountDialogOpen(false);
  };

  const savePair = () => {
    if (!isPairValid) return;

    const normalizedName = pairDraft.name.trim().toUpperCase();
    const nextPair: PairEntity = {
      id: editingPairId ?? createPairId(normalizedName),
      name: normalizedName,
      note: pairDraft.isMainPair ? 'Main Pair' : '',
      isMainPair: pairDraft.isMainPair,
      createdAt: editingPairId ? pairs.find((pair) => pair.id === editingPairId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setPairs((current) => {
      if (editingPairId) {
        return current.map((pair) => (pair.id === editingPairId ? nextPair : pair));
      }
      return [...current, nextPair];
    });

    clearPairDraft();
    setPairDialogOpen(false);
  };

  const deleteAccount = (id: string) => {
    setAccounts((current) => current.filter((account) => account.id !== id));
    if (editingAccountId === id) {
      clearAccountDraft();
      setAccountDialogOpen(false);
    }
  };

  const deletePair = (id: string) => {
    setPairs((current) => current.filter((pair) => pair.id !== id));
    if (editingPairId === id) {
      clearPairDraft();
      setPairDialogOpen(false);
    }
  };

  const saveStyle = () => {
    if (!isStyleValid) return;

    const normalizedName = styleDraft.name.trim();
    const nextStyle: StyleEntity = {
      id: editingStyleId ?? createStyleId(normalizedName),
      name: normalizedName,
      createdAt: editingStyleId ? styles.find((style) => style.id === editingStyleId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setStyles((current) => {
      if (editingStyleId) {
        return current.map((style) => (style.id === editingStyleId ? nextStyle : style));
      }
      return [...current, nextStyle];
    });

    clearStyleDraft();
    setStyleDialogOpen(false);
  };

  const deleteStyle = (id: string) => {
    setStyles((current) => current.filter((style) => style.id !== id));
    if (editingStyleId === id) {
      clearStyleDraft();
      setStyleDialogOpen(false);
    }
  };

  const saveSession = () => {
    if (!isSessionValid) return;

    const normalizedName = sessionDraft.name.trim();
    const nextSession: SessionEntity = {
      id: editingSessionId ?? createSessionId(normalizedName),
      name: normalizedName,
      timeRange: sessionDraft.timeRange.trim(),
      createdAt: editingSessionId ? sessions.find((session) => session.id === editingSessionId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setSessions((current) => {
      if (editingSessionId) {
        return current.map((session) => (session.id === editingSessionId ? nextSession : session));
      }
      return [...current, nextSession];
    });

    clearSessionDraft();
    setSessionDialogOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions((current) => current.filter((session) => session.id !== id));
    if (editingSessionId === id) {
      clearSessionDraft();
      setSessionDialogOpen(false);
    }
  };

  const saveEntryByItem = () => {
    if (!isEntryByValid) return;

    const normalizedName = entryByDraft.name.trim();
    const nextEntryBy: EntryByEntity = {
      id: editingEntryById ?? createEntryById(normalizedName),
      name: normalizedName,
      createdAt: editingEntryById ? entryByItems.find((item) => item.id === editingEntryById)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setEntryByItems((current) => {
      if (editingEntryById) {
        return current.map((item) => (item.id === editingEntryById ? nextEntryBy : item));
      }
      return [...current, nextEntryBy];
    });

    clearEntryByDraft();
    setEntryByDialogOpen(false);
  };

  const deleteEntryByItem = (id: string) => {
    setEntryByItems((current) => current.filter((item) => item.id !== id));
    if (editingEntryById === id) {
      clearEntryByDraft();
      setEntryByDialogOpen(false);
    }
  };

  const saveEntryTfItem = () => {
    if (!isEntryTfValid) return;

    const normalizedName = entryTfDraft.name.trim();
    const nextEntryTf: EntryTfEntity = {
      id: editingEntryTfId ?? createEntryTfId(normalizedName),
      name: normalizedName,
      createdAt: editingEntryTfId ? entryTfItems.find((item) => item.id === editingEntryTfId)?.createdAt ?? new Date().toISOString() : new Date().toISOString(),
    };

    setEntryTfItems((current) => {
      if (editingEntryTfId) {
        return current.map((item) => (item.id === editingEntryTfId ? nextEntryTf : item));
      }
      return [...current, nextEntryTf];
    });

    clearEntryTfDraft();
    setEntryTfDialogOpen(false);
  };

  const deleteEntryTfItem = (id: string) => {
    setEntryTfItems((current) => current.filter((item) => item.id !== id));
    if (editingEntryTfId === id) {
      clearEntryTfDraft();
      setEntryTfDialogOpen(false);
    }
  };

  const accountCards = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        stats: buildAccountStats(account, trades),
      })),
    [accounts, trades],
  );

  const pairCards = useMemo(
    () =>
      pairs.map((pair) => ({
        pair,
        stats: buildPairStats(pair, trades),
      })),
    [pairs, trades],
  );

  const styleCards = useMemo(
    () =>
      styles.map((style) => ({
        style,
        stats: buildStyleStats(style, trades),
      })),
    [styles, trades],
  );

  const sessionCards = useMemo(
    () =>
      sessions.map((session) => ({
        session,
        stats: buildSessionStats(session, trades),
      })),
    [sessions, trades],
  );

  const entryByCards = useMemo(
    () =>
      entryByItems.map((entryBy) => ({
        entryBy,
        stats: buildEntryByStats(entryBy, trades),
      })),
    [entryByItems, trades],
  );

  const entryTfCards = useMemo(
    () =>
      entryTfItems.map((entryTf) => ({
        entryTf,
        stats: buildEntryTfStats(entryTf, trades),
      })),
    [entryTfItems, trades],
  );

  const activePairStats = useMemo(() => {
    const previewPair: PairEntity = {
      id: editingPairId ?? createPairId(pairDraft.name || 'pair-preview'),
      name: pairDraft.name.trim().toUpperCase(),
      note: pairDraft.isMainPair ? 'Main Pair' : '',
      isMainPair: pairDraft.isMainPair,
      createdAt: new Date().toISOString(),
    };

    return buildPairStats(previewPair, trades);
  }, [editingPairId, pairDraft, trades]);

  const activeAccountStats = useMemo(() => {
    const previewAccount: AccountEntity = {
      id: editingAccountId ?? createAccountId(accountDraft.name || 'account-preview'),
      name: accountDraft.name.trim() || 'New page',
      startingBalance: parseMoneyInput(accountDraft.startingBalance),
      currentBalance: parseMoneyInput(accountDraft.currentBalance || accountDraft.startingBalance),
      payout: parseMoneyInput(accountDraft.payout),
      phase: accountDraft.phase.trim() || 'Phase One',
      note: '',
      createdAt: new Date().toISOString(),
    };

    return buildAccountStats(previewAccount, trades);
  }, [editingAccountId, accountDraft, trades]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
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

      <main className="container mx-auto space-y-8 px-4 py-6">
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Accounts</h1>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Active Accounts
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreateAccountDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {accountCards.map(({ account, stats }) => (
              <div key={account.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 text-xs font-semibold text-foreground">
                        {account.name.slice(0, 2).toUpperCase()}
                      </div>
                      <p className="truncate text-2xl font-semibold text-foreground">{account.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditAccountDialog(account)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditAccountDialog(account)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit account
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteAccount(account.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <p className="text-xl font-medium text-foreground">{formatCurrency(account.startingBalance)}</p>
                  <p className="font-semibold italic text-foreground">
                    Balance | {account.currentBalance.toFixed(0)}$ | {account.payout.toFixed(0)}$
                  </p>
                  <span className="inline-flex rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">{account.phase}</span>
                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} Trades | ORR | {formatPercent(stats.winRate)}
                  </p>
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-lg font-medium">{formatPercent(stats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Pairs</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Pair Database
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreatePairDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {pairCards.map(({ pair, stats }) => (
              <div key={pair.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-semibold text-muted-foreground">
                      {pair.name || 'New page'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPairDialog(pair)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditPairDialog(pair)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit pair
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deletePair(pair.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete pair
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="font-semibold text-primary">
                    {pair.isMainPair ? '-> Main Pair' : ''}
                  </p>

                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} {stats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </p>

                  <p className="text-foreground">0RR</p>

                  <div className="space-y-2">
                    <p className="italic text-muted-foreground">WR Position</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-xl font-medium">{formatPercent(stats.winRate)}</span>
                      <span className="h-5 w-5 rounded-full border border-border/70" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="italic text-muted-foreground">WR Bias</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-xl font-medium">
                        {activePairStats.biasWr === null ? '0%' : formatPercent(activePairStats.biasWr)}
                      </span>
                      <span className="h-5 w-5 rounded-full border border-border/70" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Trade Style</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Style
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreateStyleDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {styleCards.map(({ style, stats }) => (
              <div key={style.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-3xl font-semibold text-foreground">{style.name}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditStyleDialog(style)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditStyleDialog(style)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit style
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteStyle(style.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete style
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} {stats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </p>

                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-xl font-medium">{formatPercent(stats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>

                  <p className="text-foreground">ORR</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Session</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Session
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreateSessionDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {sessionCards.map(({ session, stats }) => (
              <div key={session.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-3xl font-semibold text-foreground">{session.name}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSessionDialog(session)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditSessionDialog(session)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit session
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteSession(session.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="text-foreground">{session.timeRange || 'Time range'}</p>

                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} {stats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </p>

                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-xl font-medium">{formatPercent(stats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>

                  <p className="text-foreground">ORR</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Entry By</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Entry By
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreateEntryByDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            {entryByCards.map(({ entryBy, stats }) => (
              <div key={entryBy.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-3xl font-semibold text-foreground">{entryBy.name}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEntryByDialog(entryBy)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditEntryByDialog(entryBy)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit entry by
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteEntryByItem(entryBy.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete entry by
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} {stats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </p>

                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-xl font-medium">{formatPercent(stats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>

                  <p className="text-foreground">ORR</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Database className="h-7 w-7 text-foreground" />
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">Entry TF</h2>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-4 py-2 text-sm font-medium text-foreground">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-foreground/20 text-[10px]">●</span>
              Entry TF
            </div>

            <Button type="button" className="gap-2 rounded-xl px-4" onClick={openCreateEntryTfDialog}>
              New
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            {entryTfCards.map(({ entryTf, stats }) => (
              <div key={entryTf.id} className="rounded-[22px] border border-border/60 bg-card/80 p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.85)]">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-3xl font-semibold text-foreground">{entryTf.name}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditEntryTfDialog(entryTf)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl border-border/70 bg-card">
                        <DropdownMenuItem onClick={() => openEditEntryTfDialog(entryTf)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit entry TF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteEntryTfItem(entryTf.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete entry TF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <p className="font-semibold italic text-foreground">
                    {stats.linkedTrades.length} {stats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </p>

                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-xl font-medium">{formatPercent(stats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>

                  <p className="text-foreground">ORR</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[640px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="sr-only">{editingAccountId ? 'Edit account' : 'New account'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <Input
                  value={accountDraft.name}
                  onChange={(event) => setAccountDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="New page"
                  className="h-auto border-0 bg-transparent px-0 text-5xl font-semibold tracking-tight text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>

              <div className="rounded-[24px] border border-border/60 bg-background/20 px-5 py-2">
                <NotionPropertyRow label="Deposit">
                  <Input
                    type="text"
                    value={accountDraft.startingBalance}
                    onChange={(event) => setAccountDraft((current) => ({ ...current, startingBalance: event.target.value }))}
                    placeholder="Empty"
                    inputMode="decimal"
                    className="h-11 rounded-xl border-border/50 bg-background/30 text-base md:max-w-[220px]"
                  />
                </NotionPropertyRow>

                <NotionPropertyRow label="Balance Status">
                  <div className="text-xl font-semibold italic text-foreground">
                    Balance | {parseMoneyInput(accountDraft.currentBalance || accountDraft.startingBalance).toFixed(2)}$ | {parseMoneyInput(accountDraft.payout).toFixed(0)}$
                  </div>
                </NotionPropertyRow>

                <NotionPropertyRow label="Stage">
                  <Select value={accountDraft.phase || 'Phase One'} onValueChange={(value) => setAccountDraft((current) => ({ ...current, phase: value }))}>
                    <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/30 text-base md:max-w-[220px]">
                      <SelectValue placeholder="Phase One" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/70 bg-card p-2">
                      <SelectItem value="Phase One" className="rounded-xl py-2 text-base">
                        Phase One
                      </SelectItem>
                      <SelectItem value="Phase Two" className="rounded-xl py-2 text-base">
                        Phase Two
                      </SelectItem>
                      <SelectItem value="Live" className="rounded-xl py-2 text-base">
                        Live
                      </SelectItem>
                      <SelectItem value="Demo" className="rounded-xl py-2 text-base">
                        Demo
                      </SelectItem>
                      <SelectItem value="Own deposit" className="rounded-xl py-2 text-base">
                        Own deposit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </NotionPropertyRow>

                <NotionPropertyRow label="Trades Count">
                  <div className="text-xl font-semibold italic text-foreground">
                    {activeAccountStats.linkedTrades.length} Trades | ORR | {formatPercent(activeAccountStats.winRate)}
                  </div>
                </NotionPropertyRow>

                <NotionPropertyRow label="WinRate">
                  <div className="flex items-center gap-2 text-foreground">
                    <span className="text-xl font-medium">{formatPercent(activeAccountStats.winRate)}</span>
                    <span className="h-5 w-5 rounded-full border border-border/70" />
                  </div>
                </NotionPropertyRow>
              </div>

              <div className="space-y-4 rounded-[24px] border border-border/60 bg-background/10 p-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Manual Balance Fields</p>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payout</label>
                  <Input
                    type="text"
                    value={accountDraft.payout}
                    onChange={(event) => setAccountDraft((current) => ({ ...current, payout: event.target.value }))}
                    placeholder="0"
                    inputMode="decimal"
                    className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingAccountId && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteAccount(editingAccountId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setAccountDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isAccountValid} onClick={saveAccount}>
                  {editingAccountId ? 'Save Account' : 'Add Account'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[760px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-4xl font-semibold tracking-tight text-foreground">
                {editingPairId ? 'Edit pair' : 'New page'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pair</label>
                <Input
                  value={pairDraft.name}
                  onChange={(event) => setPairDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="EURUSD"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/20 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPairDraft((current) => ({ ...current, isMainPair: !current.isMainPair }))}
                  className="flex w-full items-center justify-between gap-4 py-2 text-left"
                >
                  <span className="text-base text-foreground">Main Pair</span>
                    <span
                      className={`box-border flex aspect-square h-6 w-6 shrink-0 items-center justify-center transition ${
                        pairDraft.isMainPair ? 'bg-primary text-primary-foreground' : 'bg-white/5 text-transparent'
                      }`}
                      style={{
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: pairDraft.isMainPair ? 'rgb(139 92 246)' : 'rgb(255 255 255)',
                        borderRadius: '8px',
                      }}
                    >
                      <Check className={`h-4 w-4 transition-opacity ${pairDraft.isMainPair ? 'opacity-100' : 'opacity-0'}`} />
                    </span>
                </button>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-base text-muted-foreground">Trades Count</span>
                  <span className="text-base font-semibold italic text-foreground">
                    {activePairStats.linkedTrades.length} {activePairStats.linkedTrades.length === 1 ? 'Trade' : 'Trades'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-base text-muted-foreground">RR Count</span>
                  <span className="text-base font-semibold italic text-foreground">{activePairStats.rrTotal.toFixed(2)}RR</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-base text-muted-foreground">WinRate</span>
                  <span className="text-base font-semibold text-foreground">{formatPercent(activePairStats.winRate)}</span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-base text-muted-foreground">BIAS WR</span>
                  <span className="text-base font-semibold text-foreground">
                    {activePairStats.biasWr === null ? '0%' : formatPercent(activePairStats.biasWr)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 py-2">
                  <span className="text-base text-muted-foreground">Main Pair Show</span>
                  <span className="text-base font-semibold text-primary">
                    {pairDraft.isMainPair ? '-> Main Pair' : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPairMoreOpen((current) => !current)}
                  className="flex items-center gap-2 py-2 text-left text-muted-foreground transition hover:text-foreground"
                >
                  <ChevronDown className={`h-4 w-4 transition ${pairMoreOpen ? 'rotate-180' : ''}`} />
                  <span>{pairMoreOpen ? 'Hide extra properties' : '4 more properties'}</span>
                </button>

                {pairMoreOpen && (
                  <div className="space-y-2 border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="text-base text-muted-foreground">BIAS WR text</span>
                      <span className="text-right text-sm text-muted-foreground">{activePairStats.biasWrText}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="text-base text-muted-foreground">BIAS Position text</span>
                      <span className="text-right text-sm text-muted-foreground">{activePairStats.biasPositionText}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="text-base text-muted-foreground">Trading Journal</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {activePairStats.linkedTrades.length > 0 ? `${activePairStats.linkedTrades.length} linked trades` : 'No linked trades yet'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2">
                      <span className="text-base text-muted-foreground">Everyday Analysis</span>
                      <span className="text-right text-sm text-muted-foreground">
                        {activePairStats.everydayAnalysisCount > 0 ? `${activePairStats.everydayAnalysisCount} linked items` : 'Pending database connection'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingPairId && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deletePair(editingPairId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setPairDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isPairValid} onClick={savePair}>
                  {editingPairId ? 'Save Pair' : 'Add Pair'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={styleDialogOpen} onOpenChange={setStyleDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[640px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-4xl font-semibold tracking-tight text-foreground">
                {editingStyleId ? 'Edit style' : 'New page'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/20 px-4 py-3">
              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Style</label>
                <Input
                  value={styleDraft.name}
                  onChange={(event) => setStyleDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Intraday"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">Trades Count</span>
                <span className="text-base font-semibold italic text-foreground">0 Trades</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">WinRate</span>
                <span className="text-base font-semibold text-foreground">0%</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">RR Count</span>
                <span className="text-base font-semibold text-foreground">ORR</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingStyleId && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteStyle(editingStyleId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setStyleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isStyleValid} onClick={saveStyle}>
                  {editingStyleId ? 'Save Style' : 'Add Style'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[640px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-4xl font-semibold tracking-tight text-foreground">
                {editingSessionId ? 'Edit session' : 'New page'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/20 px-4 py-3">
              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Session</label>
                <Input
                  value={sessionDraft.name}
                  onChange={(event) => setSessionDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Asia"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Time Range</label>
                <Input
                  value={sessionDraft.timeRange}
                  onChange={(event) => setSessionDraft((current) => ({ ...current, timeRange: event.target.value }))}
                  placeholder="01:00-09:00"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">Trades Count</span>
                <span className="text-base font-semibold italic text-foreground">0 Trades</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">WinRate</span>
                <span className="text-base font-semibold text-foreground">0%</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">RR Count</span>
                <span className="text-base font-semibold text-foreground">ORR</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingSessionId && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteSession(editingSessionId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setSessionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isSessionValid} onClick={saveSession}>
                  {editingSessionId ? 'Save Session' : 'Add Session'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={entryByDialogOpen} onOpenChange={setEntryByDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[640px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-4xl font-semibold tracking-tight text-foreground">
                {editingEntryById ? 'Edit entry by' : 'New page'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/20 px-4 py-3">
              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entry By</label>
                <Input
                  value={entryByDraft.name}
                  onChange={(event) => setEntryByDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="IDM"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">Trades Count</span>
                <span className="text-base font-semibold italic text-foreground">0 Trades</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">WinRate</span>
                <span className="text-base font-semibold text-foreground">0%</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">RR Count</span>
                <span className="text-base font-semibold text-foreground">ORR</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingEntryById && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteEntryByItem(editingEntryById)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setEntryByDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isEntryByValid} onClick={saveEntryByItem}>
                  {editingEntryById ? 'Save Entry By' : 'Add Entry By'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={entryTfDialogOpen} onOpenChange={setEntryTfDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[28px] border-border/70 bg-card p-0 sm:max-w-[640px]">
          <div className="space-y-6 p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-4xl font-semibold tracking-tight text-foreground">
                {editingEntryTfId ? 'Edit entry TF' : 'New page'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/20 px-4 py-3">
              <div className="space-y-2 py-2">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Entry TF</label>
                <Input
                  value={entryTfDraft.name}
                  onChange={(event) => setEntryTfDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="4H"
                  className="h-12 rounded-xl border-border/60 bg-background/40 text-base"
                />
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">Trades Count</span>
                <span className="text-base font-semibold italic text-foreground">0 Trades</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">WinRate</span>
                <span className="text-base font-semibold text-foreground">0%</span>
              </div>

              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-base text-muted-foreground">RR Count</span>
                <span className="text-base font-semibold text-foreground">ORR</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-border/50 pt-4">
              <div>
                {editingEntryTfId && (
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteEntryTfItem(editingEntryTfId)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setEntryTfDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!isEntryTfValid} onClick={saveEntryTfItem}>
                  {editingEntryTfId ? 'Save Entry TF' : 'Add Entry TF'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
