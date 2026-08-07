import { AccountEntity, EntryByEntity, EntryTfEntity, PairEntity, SessionEntity, StyleEntity, TradeEntry } from '@/lib/types';

export const TRADES_STORAGE_KEY = 'tradely-trades-log';
export const PAIRS_STORAGE_KEY = 'tradely-pairs-registry';
export const ACCOUNTS_STORAGE_KEY = 'tradely-accounts-registry';
export const STYLES_STORAGE_KEY = 'tradely-styles-registry';
export const SESSIONS_STORAGE_KEY = 'tradely-sessions-registry';
export const ENTRY_BY_STORAGE_KEY = 'tradely-entry-by-registry';
export const ENTRY_TF_STORAGE_KEY = 'tradely-entry-tf-registry';

export const DEFAULT_PAIRS: PairEntity[] = [
  { id: 'audusd', name: 'AUDUSD', note: '', isMainPair: false, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'usdcad', name: 'USDCAD', note: '', isMainPair: false, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'eurusd', name: 'EURUSD', note: 'Main Pair', isMainPair: true, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'sp100', name: 'SP100', note: '', isMainPair: false, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'nas100', name: 'NAS100', note: '', isMainPair: false, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'xauusd', name: 'XAUUSD', note: 'Main Pair', isMainPair: true, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'usdjpy', name: 'USDJPY', note: '', isMainPair: false, createdAt: '2026-08-06T00:00:00.000Z' },
  { id: 'gbpusd', name: 'GBPUSD', note: 'Main Pair', isMainPair: true, createdAt: '2026-08-06T00:00:00.000Z' },
];

export const DEFAULT_ACCOUNTS: AccountEntity[] = [
  {
    id: 'ftmo',
    name: 'FTMO',
    startingBalance: 50000,
    currentBalance: 50000,
    payout: 0,
    phase: 'Phase One',
    note: '',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'funding-pips',
    name: 'Funding Pips',
    startingBalance: 25000,
    currentBalance: 25000,
    payout: 0,
    phase: 'Phase One',
    note: '',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
];

export const DEFAULT_STYLES: StyleEntity[] = [
  {
    id: 'intraday',
    name: 'Intraday',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'swing',
    name: 'Swing',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
];

export const DEFAULT_SESSIONS: SessionEntity[] = [
  {
    id: 'asia',
    name: 'Asia',
    timeRange: '01:00-09:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'frankfurt',
    name: 'Frankfurt',
    timeRange: '09:00-10:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'lo-kz',
    name: 'LO KZ',
    timeRange: '10:00-12:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'lunch',
    name: 'Lunch',
    timeRange: '12:00-14:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'ny-kz',
    name: 'NY KZ',
    timeRange: '14:00-17:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'out-of-ott',
    name: 'Out of OTT',
    timeRange: '17:00-01:00',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
];

export const DEFAULT_ENTRY_BY: EntryByEntity[] = [
  {
    id: 'idm',
    name: 'IDM',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'fvg',
    name: 'FVG',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: 'snr',
    name: 'SNR',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
];

export const DEFAULT_ENTRY_TF: EntryTfEntity[] = [
  {
    id: 'daily',
    name: 'Daily',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: '4h',
    name: '4H',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: '1h',
    name: '1H',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: '15m',
    name: '15M',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
  {
    id: '5m',
    name: '5M',
    createdAt: '2026-08-06T00:00:00.000Z',
  },
];

export type TradeOutcome = TradeEntry['outcome'];

export function createEmptyTradeEntry(): TradeEntry {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  return {
    id: crypto.randomUUID(),
    date: today,
    trade: 'Open Trade',
    account: '',
    accountId: '',
    mainTradeId: null,
    subTradeIds: [],
    pairId: '',
    pair: '',
    outcome: 'in-progress',
    risk: 0,
    rrReal: 0,
    rrDollar: 0,
    profitPercent: 0,
    profitDollar: 0,
    allRr: 0,
    allProfitPercent: 0,
    allProfitDollar: 0,
    goodTrade: false,
    direction: 'long',
    strategy: '',
    style: '',
    session: '',
    entryTf: '',
    entryBy: '',
    description: '',
    emotion: '',
    timeframe1D: '',
    timeframe4H: '',
    entryNotes: '',
    exitNotes: '',
    analysis: '',
    infoLine: '',
    profitLoss: 0,
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

type LegacyTradeEntry = Partial<TradeEntry> & {
  id: string;
  date: string;
  asset?: string;
  pair?: string;
  strategy?: string;
  trade?: string;
  account?: string;
  accountId?: string;
  outcome?: TradeOutcome;
  risk?: number;
  rr?: number;
  rrReal?: number;
  rrDollar?: number;
  allRr?: number;
  allProfit?: number;
  allProfitPercent?: number;
  allProfitDollar?: number;
  profitPercent?: number;
  profitDollar?: number;
  goodTrade?: boolean;
  profitLoss?: number;
  direction?: 'long' | 'short';
  notes?: string;
  analysis?: string;
  infoLine?: string;
  mainTradeId?: null | string;
  subTradeIds?: string[];
  pairId?: string;
  createdAt: string;
  updatedAt: string;
};

export function createPairId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createAccountId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createStyleId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createSessionId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createEntryById(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function createEntryTfId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function normalizeOutcomeFromProfit(profitLoss: number): TradeOutcome {
  if (profitLoss > 0) return 'win';
  if (profitLoss < 0) return 'loss';
  return 'breakeven';
}

export function normalizeTradeEntry(entry: LegacyTradeEntry): TradeEntry {
  const rrDollar = typeof entry.rrDollar === 'number' ? entry.rrDollar : typeof entry.profitLoss === 'number' ? entry.profitLoss : 0;
  const risk = typeof entry.risk === 'number' && !Number.isNaN(entry.risk) ? entry.risk : 0;
  const trade = (entry.trade ?? entry.strategy ?? entry.direction ?? '').toString().trim();
  const pairName = (entry.pair ?? entry.asset ?? '').trim();
  const rrReal = typeof entry.rrReal === 'number' ? entry.rrReal : risk > 0 ? rrDollar / risk : 0;
  const profitPercent = typeof entry.profitPercent === 'number' ? entry.profitPercent : 0;
  const profitDollar = typeof entry.profitDollar === 'number' ? entry.profitDollar : rrDollar;

  return {
    id: entry.id,
    date: entry.date,
    trade,
    account: (entry.account ?? '').trim(),
    accountId: entry.accountId?.trim() || createAccountId((entry.account ?? '').trim()),
    mainTradeId: entry.mainTradeId ?? null,
    subTradeIds: Array.isArray(entry.subTradeIds) ? entry.subTradeIds : [],
    pairId: entry.pairId?.trim() || createPairId(pairName),
    outcome: entry.outcome ?? normalizeOutcomeFromProfit(rrDollar),
    pair: pairName,
    risk,
    rrReal,
    rrDollar,
    profitPercent,
    profitDollar,
    allRr: typeof entry.allRr === 'number' ? entry.allRr : rrReal,
    allProfitPercent: typeof entry.allProfitPercent === 'number' ? entry.allProfitPercent : profitPercent,
    allProfitDollar:
      typeof entry.allProfitDollar === 'number'
        ? entry.allProfitDollar
        : typeof entry.allProfit === 'number'
          ? entry.allProfit
          : profitDollar,
    goodTrade: Boolean(entry.goodTrade),
    direction: entry.direction ?? 'long',
    strategy: entry.strategy ?? trade,
    style: entry.style ?? '',
    session: entry.session ?? '',
    entryTf: entry.entryTf ?? '',
    entryBy: entry.entryBy ?? '',
    description: entry.description ?? '',
    emotion: entry.emotion ?? '',
    timeframe1D: entry.timeframe1D ?? '',
    timeframe4H: entry.timeframe4H ?? '',
    entryNotes: entry.entryNotes ?? '',
    exitNotes: entry.exitNotes ?? '',
    analysis: entry.analysis ?? '',
    infoLine: entry.infoLine ?? '',
    profitLoss: typeof entry.profitLoss === 'number' ? entry.profitLoss : rrDollar,
    notes: entry.notes ?? '',
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}

export function deriveTrades(entries: TradeEntry[]) {
  const byId = new Map(entries.map((entry) => [entry.id, entry]));

  return entries.map((entry) => {
    const subTrades = entries.filter((candidate) => candidate.mainTradeId === entry.id);
    const allRr = entry.rrReal + subTrades.reduce((sum, item) => sum + item.rrReal, 0);
    const allProfitPercent = entry.profitPercent + subTrades.reduce((sum, item) => sum + item.profitPercent, 0);
    const allProfitDollar = entry.profitDollar + subTrades.reduce((sum, item) => sum + item.profitDollar, 0);

    return {
      ...entry,
      subTradeIds: subTrades.map((item) => item.id),
      mainTradeId: entry.mainTradeId && byId.has(entry.mainTradeId) ? entry.mainTradeId : null,
      allRr,
      allProfitPercent,
      allProfitDollar,
    };
  });
}

export function loadPairs() {
  const savedPairs = window.localStorage.getItem(PAIRS_STORAGE_KEY);
  if (!savedPairs) return DEFAULT_PAIRS;

  try {
    const parsed = JSON.parse(savedPairs) as PairEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_PAIRS;
  } catch {
    window.localStorage.removeItem(PAIRS_STORAGE_KEY);
    return DEFAULT_PAIRS;
  }
}

export function savePairs(pairs: PairEntity[]) {
  window.localStorage.setItem(PAIRS_STORAGE_KEY, JSON.stringify(pairs));
}

export function loadAccounts() {
  const savedAccounts = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!savedAccounts) return DEFAULT_ACCOUNTS;

  try {
    const parsed = JSON.parse(savedAccounts) as AccountEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_ACCOUNTS;
  } catch {
    window.localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
    return DEFAULT_ACCOUNTS;
  }
}

export function saveAccounts(accounts: AccountEntity[]) {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

export function loadStyles() {
  const savedStyles = window.localStorage.getItem(STYLES_STORAGE_KEY);
  if (!savedStyles) return DEFAULT_STYLES;

  try {
    const parsed = JSON.parse(savedStyles) as StyleEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_STYLES;
  } catch {
    window.localStorage.removeItem(STYLES_STORAGE_KEY);
    return DEFAULT_STYLES;
  }
}

export function saveStyles(styles: StyleEntity[]) {
  window.localStorage.setItem(STYLES_STORAGE_KEY, JSON.stringify(styles));
}

export function loadSessions() {
  const savedSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!savedSessions) return DEFAULT_SESSIONS;

  try {
    const parsed = JSON.parse(savedSessions) as SessionEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_SESSIONS;
  } catch {
    window.localStorage.removeItem(SESSIONS_STORAGE_KEY);
    return DEFAULT_SESSIONS;
  }
}

export function saveSessions(sessions: SessionEntity[]) {
  window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
}

export function loadEntryBy() {
  const savedEntryBy = window.localStorage.getItem(ENTRY_BY_STORAGE_KEY);
  if (!savedEntryBy) return DEFAULT_ENTRY_BY;

  try {
    const parsed = JSON.parse(savedEntryBy) as EntryByEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_ENTRY_BY;
  } catch {
    window.localStorage.removeItem(ENTRY_BY_STORAGE_KEY);
    return DEFAULT_ENTRY_BY;
  }
}

export function saveEntryBy(entryByItems: EntryByEntity[]) {
  window.localStorage.setItem(ENTRY_BY_STORAGE_KEY, JSON.stringify(entryByItems));
}

export function loadEntryTf() {
  const savedEntryTf = window.localStorage.getItem(ENTRY_TF_STORAGE_KEY);
  if (!savedEntryTf) return DEFAULT_ENTRY_TF;

  try {
    const parsed = JSON.parse(savedEntryTf) as EntryTfEntity[];
    return parsed.length > 0 ? parsed : DEFAULT_ENTRY_TF;
  } catch {
    window.localStorage.removeItem(ENTRY_TF_STORAGE_KEY);
    return DEFAULT_ENTRY_TF;
  }
}

export function saveEntryTf(entryTfItems: EntryTfEntity[]) {
  window.localStorage.setItem(ENTRY_TF_STORAGE_KEY, JSON.stringify(entryTfItems));
}

export function loadTrades() {
  const savedTrades = window.localStorage.getItem(TRADES_STORAGE_KEY);
  if (!savedTrades) return [] as TradeEntry[];

  try {
    const parsed = JSON.parse(savedTrades) as LegacyTradeEntry[];
    return deriveTrades(parsed.map(normalizeTradeEntry));
  } catch {
    window.localStorage.removeItem(TRADES_STORAGE_KEY);
    return [] as TradeEntry[];
  }
}

export function saveTrades(entries: TradeEntry[]) {
  window.localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(entries));
}
