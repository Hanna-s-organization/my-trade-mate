import { TradingProfile, DailyEntry } from './types';

export function generateDemoData(): { profile: TradingProfile; entries: DailyEntry[] } {
  const profile: TradingProfile = {
    initialDeposit: 10000,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };

  const now = new Date();
  const entries: DailyEntry[] = [];
  let balance = profile.initialDeposit;

  // Generate 60 days of demo data
  for (let i = 59; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const variance = (Math.random() - 0.35) * balance * 0.025;
    const profit = Math.round(variance * 100) / 100;
    const percent = (profit / balance) * 100;
    const ending = balance + profit;

    const withdrawal = (i % 20 === 0 && i > 0) ? Math.round(balance * 0.05 * 100) / 100 : 0;

    entries.push({
      id: crypto.randomUUID(),
      date: date.toISOString().split('T')[0],
      profitAmount: profit,
      profitPercent: Math.round(percent * 100) / 100,
      withdrawal,
      startingBalance: Math.round(balance * 100) / 100,
      endingBalance: Math.round((ending - withdrawal) * 100) / 100,
      notes: withdrawal > 0 ? 'Виведення коштів' : '',
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    });
    balance = ending - withdrawal;
  }

  return { profile, entries };
}
