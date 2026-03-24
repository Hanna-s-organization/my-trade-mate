import { TradingProfile, DailyEntry } from './types';

const PROFILE_KEY = 'trading_profile';
const ENTRIES_KEY = 'trading_entries';

export function getProfile(): TradingProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveProfile(profile: TradingProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getEntries(): DailyEntry[] {
  const raw = localStorage.getItem(ENTRIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveEntries(entries: DailyEntry[]): void {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function addEntry(entry: DailyEntry): DailyEntry[] {
  const entries = getEntries();
  entries.push(entry);
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries(entries);
  return entries;
}

export function updateEntry(id: string, updates: Partial<DailyEntry>): DailyEntry[] {
  const entries = getEntries().map(e =>
    e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
  );
  entries.sort((a, b) => a.date.localeCompare(b.date));
  saveEntries(entries);
  return entries;
}

export function deleteEntry(id: string): DailyEntry[] {
  const entries = getEntries().filter(e => e.id !== id);
  saveEntries(entries);
  return entries;
}

export function recalculateEntries(initialDeposit: number, entries: DailyEntry[]): DailyEntry[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let balance = initialDeposit;
  return sorted.map(entry => {
    const withdrawal = entry.withdrawal || 0;
    const startingBalance = balance;
    const profitPercent = startingBalance > 0 ? (entry.profitAmount / startingBalance) * 100 : 0;
    const endingBalance = startingBalance + entry.profitAmount - withdrawal;
    balance = endingBalance;
    return { ...entry, withdrawal, startingBalance, profitPercent, endingBalance };
  });
}
