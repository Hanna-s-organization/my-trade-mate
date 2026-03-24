import { useState, useCallback, useEffect } from 'react';
import { TradingProfile, DailyEntry } from '@/lib/types';
import * as storage from '@/lib/storage';

export function useTrading() {
  const [profile, setProfile] = useState<TradingProfile | null>(storage.getProfile());
  const [entries, setEntries] = useState<DailyEntry[]>(storage.getEntries());

  const saveProfile = useCallback((p: TradingProfile) => {
    storage.saveProfile(p);
    setProfile(p);
    // Recalculate entries with new deposit
    const recalced = storage.recalculateEntries(p.initialDeposit, storage.getEntries());
    storage.saveEntries(recalced);
    setEntries(recalced);
  }, []);

  const addEntry = useCallback((date: string, profitAmount: number, notes: string) => {
    if (!profile) return;
    const allEntries = storage.getEntries();
    const newEntry: DailyEntry = {
      id: crypto.randomUUID(),
      date,
      profitAmount,
      profitPercent: 0,
      startingBalance: 0,
      endingBalance: 0,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allEntries.push(newEntry);
    const recalced = storage.recalculateEntries(profile.initialDeposit, allEntries);
    storage.saveEntries(recalced);
    setEntries(recalced);
  }, [profile]);

  const updateEntry = useCallback((id: string, updates: { profitAmount?: number; notes?: string; date?: string }) => {
    if (!profile) return;
    const allEntries = storage.getEntries().map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    const recalced = storage.recalculateEntries(profile.initialDeposit, allEntries);
    storage.saveEntries(recalced);
    setEntries(recalced);
  }, [profile]);

  const deleteEntry = useCallback((id: string) => {
    if (!profile) return;
    const allEntries = storage.getEntries().filter(e => e.id !== id);
    const recalced = storage.recalculateEntries(profile.initialDeposit, allEntries);
    storage.saveEntries(recalced);
    setEntries(recalced);
  }, [profile]);

  const loadDemoData = useCallback(async () => {
    const { generateDemoData } = await import('@/lib/demo-data');
    const { profile: demoProfile, entries: demoEntries } = generateDemoData();
    storage.saveProfile(demoProfile);
    storage.saveEntries(demoEntries);
    setProfile(demoProfile);
    setEntries(demoEntries);
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem('trading_profile');
    localStorage.removeItem('trading_entries');
    setProfile(null);
    setEntries([]);
  }, []);

  const currentBalance = entries.length > 0
    ? entries[entries.length - 1].endingBalance
    : (profile?.initialDeposit ?? 0);

  return {
    profile,
    entries,
    currentBalance,
    saveProfile,
    addEntry,
    updateEntry,
    deleteEntry,
    loadDemoData,
    clearAll,
  };
}
