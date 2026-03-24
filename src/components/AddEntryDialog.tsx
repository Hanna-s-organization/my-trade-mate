import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';

interface Props {
  onAdd: (date: string, profit: number, notes: string) => void;
}

export default function AddEntryDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [profit, setProfit] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(profit);
    if (isNaN(val)) return;
    onAdd(date, val, notes);
    setProfit('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" /> Додати запис
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новий торговий день</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Дата</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Прибуток / Збиток ($)</label>
            <Input
              type="number"
              step="0.01"
              placeholder="+150.00 або -50.00"
              value={profit}
              onChange={e => setProfit(e.target.value)}
              className="font-mono"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Нотатки</label>
            <Textarea placeholder="Опціонально..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={!profit}>
            Зберегти
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
