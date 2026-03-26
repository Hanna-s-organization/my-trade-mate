import { useState, useMemo } from 'react';
import { DailyEntry } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Pencil, Check, X, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddEntryDialog from './AddEntryDialog';

interface Props {
  entries: DailyEntry[];
  onAdd: (date: string, profit: number, notes: string, withdrawal?: number) => void;
  onUpdate: (id: string, updates: { profitAmount?: number; notes?: string; date?: string; withdrawal?: number }) => void;
  onDelete: (id: string) => void;
  showBalance: boolean;
  showProfitAmounts: boolean;
}

function formatMonthOption(value: string) {
  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function EntriesTable({ entries, onAdd, onUpdate, onDelete, showBalance, showProfitAmounts }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editProfit, setEditProfit] = useState('');
  const [editWithdrawal, setEditWithdrawal] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    entries.forEach(e => months.add(e.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(e => e.date.startsWith(selectedMonth));
    }
    if (dateFrom) {
      filtered = filtered.filter(e => e.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(e => e.date <= dateTo);
    }
    return filtered;
  }, [entries, selectedMonth, dateFrom, dateTo]);

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedMonth('all');
  };

  const hasFilters = dateFrom || dateTo || selectedMonth !== 'all';

  const startEdit = (entry: DailyEntry) => {
    setEditId(entry.id);
    setEditProfit(entry.profitAmount.toString());
    setEditWithdrawal((entry.withdrawal || 0).toString());
    setEditNotes(entry.notes);
  };

  const cancelEdit = () => setEditId(null);

  const saveEdit = (id: string) => {
    const val = parseFloat(editProfit);
    if (isNaN(val)) return;
    const wd = parseFloat(editWithdrawal) || 0;
    onUpdate(id, { profitAmount: val, withdrawal: wd, notes: editNotes });
    setEditId(null);
  };

  const reversed = [...filteredEntries].reverse();

  return (
    <Card className="animate-fade-in card-elevated" style={{ animationDelay: '200ms' }}>
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trading Journal</CardTitle>
          <AddEntryDialog onAdd={onAdd} />
        </div>
        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex h-8 items-center gap-1.5 text-xs font-medium text-muted-foreground self-end">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setSelectedMonth('all'); }}
              className="h-8 w-36 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setSelectedMonth('all'); }}
              className="h-8 w-36 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Month</label>
            <Select value={selectedMonth} onValueChange={v => { setSelectedMonth(v); setDateFrom(''); setDateTo(''); }}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {monthOptions.map(m => (
                  <SelectItem key={m} value={m}>{formatMonthOption(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">{entries.length === 0 ? 'No entries yet. Add your first trading day!' : 'No entries match the selected filters.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Profit ($)</TableHead>
                  <TableHead className="text-xs text-right">%</TableHead>
                  <TableHead className="text-xs text-right">Withdrawal ($)</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs">Notes</TableHead>
                  <TableHead className="text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reversed.map(entry => (
                  <TableRow key={entry.id} className="transition-colors">
                    <TableCell className="font-mono text-xs text-foreground">{entry.date}</TableCell>
                    <TableCell className="text-right">
                      {editId === entry.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editProfit}
                          onChange={e => setEditProfit(e.target.value)}
                          className="h-7 w-24 font-mono text-xs text-right ml-auto"
                        />
                      ) : (
                        <span className={`font-mono text-sm font-medium ${entry.profitAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {showProfitAmounts ? `${entry.profitAmount >= 0 ? '+' : ''}${entry.profitAmount.toFixed(2)}` : '••••••'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-mono text-xs ${entry.profitPercent >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {entry.profitPercent >= 0 ? '+' : ''}{entry.profitPercent.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      {editId === entry.id ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editWithdrawal}
                          onChange={e => setEditWithdrawal(e.target.value)}
                          className="h-7 w-24 font-mono text-xs text-right ml-auto"
                        />
                      ) : (
                        <span className={`font-mono text-xs ${(entry.withdrawal || 0) > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {(entry.withdrawal || 0) > 0 ? `-${(entry.withdrawal || 0).toFixed(2)}` : '—'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {showBalance ? `$${entry.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '••••••'}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {editId === entry.id ? (
                        <Input
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Notes..."
                        />
                      ) : (
                        <span className="text-muted-foreground">{entry.notes || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {editId === entry.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success" onClick={() => saveEdit(entry.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(entry.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
