import { useState, useCallback, useEffect } from 'react';
import { TradingProfile, DailyEntry } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

function recalculateEntries(initialDeposit: number, entries: DailyEntry[]): DailyEntry[] {
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

export function useTrading() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TradingProfile | null>(null);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setEntries([]);
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('trading_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        const p: TradingProfile = {
          initialDeposit: Number(profileData.initial_deposit),
          currency: profileData.currency,
          createdAt: profileData.created_at,
        };
        setProfile(p);

        // Load entries
        const { data: entriesData } = await supabase
          .from('trading_entries')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (entriesData) {
          const mapped: DailyEntry[] = entriesData.map(e => ({
            id: e.id,
            date: e.date,
            profitAmount: Number(e.profit_amount),
            profitPercent: Number(e.profit_percent),
            withdrawal: Number(e.withdrawal),
            startingBalance: Number(e.starting_balance),
            endingBalance: Number(e.ending_balance),
            notes: e.notes || '',
            createdAt: e.created_at,
            updatedAt: e.updated_at,
          }));
          const recalced = recalculateEntries(p.initialDeposit, mapped);
          setEntries(recalced);
        }
      } else {
        setProfile(null);
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = useCallback(async (p: TradingProfile) => {
    if (!user) return;
    // Upsert profile
    await supabase.from('trading_profiles').upsert({
      user_id: user.id,
      initial_deposit: p.initialDeposit,
      currency: p.currency,
    }, { onConflict: 'user_id' });

    setProfile(p);

    // Recalculate entries with new deposit
    if (entries.length > 0) {
      const recalced = recalculateEntries(p.initialDeposit, entries);
      setEntries(recalced);
      // Batch update entries in DB
      for (const e of recalced) {
        await supabase.from('trading_entries').update({
          profit_percent: e.profitPercent,
          starting_balance: e.startingBalance,
          ending_balance: e.endingBalance,
        }).eq('id', e.id);
      }
    }
  }, [user, entries]);

  const addEntry = useCallback(async (date: string, profitAmount: number, notes: string, withdrawal: number = 0) => {
    if (!profile || !user) return;

    const newEntry: DailyEntry = {
      id: crypto.randomUUID(),
      date,
      profitAmount,
      profitPercent: 0,
      withdrawal,
      startingBalance: 0,
      endingBalance: 0,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const allEntries = [...entries, newEntry];
    const recalced = recalculateEntries(profile.initialDeposit, allEntries);
    setEntries(recalced);

    // Find the new entry in recalced
    const recalcedNew = recalced.find(e => e.id === newEntry.id)!;
    await supabase.from('trading_entries').insert({
      id: recalcedNew.id,
      user_id: user.id,
      date: recalcedNew.date,
      profit_amount: recalcedNew.profitAmount,
      profit_percent: recalcedNew.profitPercent,
      withdrawal: recalcedNew.withdrawal,
      starting_balance: recalcedNew.startingBalance,
      ending_balance: recalcedNew.endingBalance,
      notes: recalcedNew.notes,
    });

    // Update subsequent entries
    for (const e of recalced) {
      if (e.id !== newEntry.id) {
        await supabase.from('trading_entries').update({
          profit_percent: e.profitPercent,
          starting_balance: e.startingBalance,
          ending_balance: e.endingBalance,
        }).eq('id', e.id);
      }
    }
  }, [profile, user, entries]);

  const updateEntry = useCallback(async (id: string, updates: { profitAmount?: number; notes?: string; date?: string; withdrawal?: number }) => {
    if (!profile || !user) return;
    const allEntries = entries.map(e =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    const recalced = recalculateEntries(profile.initialDeposit, allEntries);
    setEntries(recalced);

    const updated = recalced.find(e => e.id === id)!;
    await supabase.from('trading_entries').update({
      date: updated.date,
      profit_amount: updated.profitAmount,
      profit_percent: updated.profitPercent,
      withdrawal: updated.withdrawal,
      starting_balance: updated.startingBalance,
      ending_balance: updated.endingBalance,
      notes: updated.notes,
    }).eq('id', id);

    // Update other affected entries
    for (const e of recalced) {
      if (e.id !== id) {
        await supabase.from('trading_entries').update({
          profit_percent: e.profitPercent,
          starting_balance: e.startingBalance,
          ending_balance: e.endingBalance,
        }).eq('id', e.id);
      }
    }
  }, [profile, user, entries]);

  const deleteEntry = useCallback(async (id: string) => {
    if (!profile || !user) return;
    const allEntries = entries.filter(e => e.id !== id);
    const recalced = recalculateEntries(profile.initialDeposit, allEntries);
    setEntries(recalced);

    await supabase.from('trading_entries').delete().eq('id', id);

    for (const e of recalced) {
      await supabase.from('trading_entries').update({
        profit_percent: e.profitPercent,
        starting_balance: e.startingBalance,
        ending_balance: e.endingBalance,
      }).eq('id', e.id);
    }
  }, [profile, user, entries]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    await supabase.from('trading_entries').delete().eq('user_id', user.id);
    await supabase.from('trading_profiles').delete().eq('user_id', user.id);
    setProfile(null);
    setEntries([]);
  }, [user]);

  const currentBalance = entries.length > 0
    ? entries[entries.length - 1].endingBalance
    : (profile?.initialDeposit ?? 0);

  return {
    profile,
    entries,
    currentBalance,
    loading,
    saveProfile,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAll,
  };
}
