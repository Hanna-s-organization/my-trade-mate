import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parseDecimalInput } from '@/lib/parse-decimal';
import { Plus } from 'lucide-react';

interface Props {
  onAdd: (date: string, profit: number, notes: string, withdrawal?: number) => void;
}

const ADD_ENTRY_DRAFT_KEY = 'tradely-add-entry-draft';

export default function AddEntryDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [profit, setProfit] = useState('');
  const [withdrawal, setWithdrawal] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const savedDraft = window.sessionStorage.getItem(ADD_ENTRY_DRAFT_KEY);
    if (!savedDraft) return;

    try {
      const parsed = JSON.parse(savedDraft) as {
        open?: boolean;
        date?: string;
        profit?: string;
        withdrawal?: string;
        notes?: string;
      };

      setOpen(Boolean(parsed.open));
      setDate(parsed.date || new Date().toISOString().split('T')[0]);
      setProfit(parsed.profit || '');
      setWithdrawal(parsed.withdrawal || '');
      setNotes(parsed.notes || '');
    } catch {
      window.sessionStorage.removeItem(ADD_ENTRY_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    window.sessionStorage.setItem(
      ADD_ENTRY_DRAFT_KEY,
      JSON.stringify({
        open,
        date,
        profit,
        withdrawal,
        notes,
      }),
    );
  }, [open, date, profit, withdrawal, notes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseDecimalInput(profit);
    if (isNaN(val)) return;
    const wd = parseDecimalInput(withdrawal) || 0;
    onAdd(date, val, notes, wd);
    setProfit('');
    setWithdrawal('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setOpen(false);
    window.sessionStorage.removeItem(ADD_ENTRY_DRAFT_KEY);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Trading Day</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <Input type="date" lang="en-GB" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Profit / Loss ($)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="+150.00 or -50.00"
              value={profit}
              onChange={e => setProfit(e.target.value)}
              className="font-mono"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Withdrawal ($)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={withdrawal}
              onChange={e => setWithdrawal(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Notes</label>
            <Textarea placeholder="Optional..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={!profit || isNaN(parseDecimalInput(profit))}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
