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
  startingBalance: number;
  endingBalance: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
