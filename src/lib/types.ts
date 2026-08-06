export interface TradingProfile {
  initialDeposit: number;
  currency: string;
  createdAt: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  profitAmount: number;
  profitPercent: number;
  withdrawal: number;
  startingBalance: number;
  endingBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PairEntity {
  id: string;
  name: string;
  note: string;
  isMainPair: boolean;
  createdAt: string;
}

export interface AccountEntity {
  id: string;
  name: string;
  startingBalance: number;
  currentBalance: number;
  payout: number;
  phase: string;
  note: string;
  createdAt: string;
}

export interface StyleEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface SessionEntity {
  id: string;
  name: string;
  timeRange: string;
  createdAt: string;
}

export interface EntryByEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface EntryTfEntity {
  id: string;
  name: string;
  createdAt: string;
}

export interface TradeEntry {
  id: string;
  date: string;
  trade: string;
  account: string;
  accountId: string;
  mainTradeId: null | string;
  subTradeIds: string[];
  pairId: string;
  pair: string;
  outcome: 'win' | 'loss' | 'breakeven' | 'in-progress' | 'missed';
  risk: number;
  rrReal: number;
  rrDollar: number;
  profitPercent: number;
  profitDollar: number;
  allRr: number;
  allProfitPercent: number;
  allProfitDollar: number;
  goodTrade: boolean;
  direction: 'long' | 'short';
  strategy: string;
  style: string;
  session: string;
  entryTf: string;
  entryBy: string;
  description: string;
  emotion: string;
  timeframe1D: string;
  timeframe4H: string;
  entryNotes: string;
  exitNotes: string;
  analysis: string;
  infoLine: string;
  profitLoss: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
