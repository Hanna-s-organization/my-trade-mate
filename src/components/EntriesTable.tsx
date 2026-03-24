import { useState } from 'react';
import { DailyEntry } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AddEntryDialog from './AddEntryDialog';

interface Props {
  entries: DailyEntry[];
  onAdd: (date: string, profit: number, notes: string, withdrawal?: number) => void;
  onUpdate: (id: string, updates: { profitAmount?: number; notes?: string; date?: string; withdrawal?: number }) => void;
  onDelete: (id: string) => void;
}

export default function EntriesTable({ entries, onAdd, onUpdate, onDelete }: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editProfit, setEditProfit] = useState('');
  const [editWithdrawal, setEditWithdrawal] = useState('');
  const [editNotes, setEditNotes] = useState('');

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

  const reversed = [...entries].reverse();

  return (
    <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Журнал угод</CardTitle>
        <AddEntryDialog onAdd={onAdd} />
      </CardHeader>
      <CardContent className="p-0">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Ще немає записів. Додайте перший торговий день!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Дата</TableHead>
                  <TableHead className="text-xs text-right">Прибуток ($)</TableHead>
                  <TableHead className="text-xs text-right">%</TableHead>
                  <TableHead className="text-xs text-right">Виведення ($)</TableHead>
                  <TableHead className="text-xs text-right">Баланс</TableHead>
                  <TableHead className="text-xs">Нотатки</TableHead>
                  <TableHead className="text-xs w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reversed.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-xs">{entry.date}</TableCell>
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
                          {entry.profitAmount >= 0 ? '+' : ''}{entry.profitAmount.toFixed(2)}
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
                    <TableCell className="text-right font-mono text-xs">
                      ${entry.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {editId === entry.id ? (
                        <Input
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          className="h-7 text-xs"
                          placeholder="Нотатки..."
                        />
                      ) : (
                        <span className="text-muted-foreground">{entry.notes || '—'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {editId === entry.id ? (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => saveEdit(entry.id)}>
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(entry)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(entry.id)}>
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
