import { useEffect, useMemo, useRef, useState } from 'react';
import { DailyEntry } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Pencil, Check, X, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseDecimalInput } from '@/lib/parse-decimal';
import AddEntryDialog from './AddEntryDialog';

interface Props {
  entries: DailyEntry[];
  onAdd: (date: string, profit: number, notes: string, withdrawal?: number) => void;
  onUpdate: (
    id: string,
    updates: { profitAmount?: number; notes?: string; date?: string; withdrawal?: number },
  ) => void;
  onDelete: (id: string) => void;
  showBalance: boolean;
  showProfitAmounts: boolean;
}

const JOURNAL_UI_STATE_KEY = 'tradely-journal-ui-state';
const JOURNAL_COLLAPSE_STORAGE_KEY = 'tradely-journal-collapsed';
const JOURNAL_PREVIEW_COUNT = 6;

function formatMonthOption(value: string) {
  const [year, month] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
}

export default function EntriesTable({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  showBalance,
  showProfitAmounts,
}: Props) {
  const restoredDraftRef = useRef(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editProfit, setEditProfit] = useState('');
  const [editWithdrawal, setEditWithdrawal] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const savedCollapsedState = window.localStorage.getItem(JOURNAL_COLLAPSE_STORAGE_KEY);
    if (savedCollapsedState !== null) {
      setIsCollapsed(savedCollapsedState === 'true');
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(JOURNAL_COLLAPSE_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (restoredDraftRef.current) return;

    const savedState = window.sessionStorage.getItem(JOURNAL_UI_STATE_KEY);
    restoredDraftRef.current = true;
    if (!savedState) return;

    try {
      const parsed = JSON.parse(savedState) as {
        editId?: string | null;
        editDate?: string;
        editProfit?: string;
        editWithdrawal?: string;
        editNotes?: string;
        dateFrom?: string;
        dateTo?: string;
        selectedMonth?: string;
      };

      const savedEditId = parsed.editId ?? null;
      const editEntryExists = savedEditId ? entries.some((entry) => entry.id === savedEditId) : false;

      setEditId(editEntryExists ? savedEditId : null);
      setEditDate(editEntryExists ? parsed.editDate || '' : '');
      setEditProfit(editEntryExists ? parsed.editProfit || '' : '');
      setEditWithdrawal(editEntryExists ? parsed.editWithdrawal || '' : '');
      setEditNotes(editEntryExists ? parsed.editNotes || '' : '');
      setDateFrom(parsed.dateFrom || '');
      setDateTo(parsed.dateTo || '');
      setSelectedMonth(parsed.selectedMonth || 'all');
    } catch {
      window.sessionStorage.removeItem(JOURNAL_UI_STATE_KEY);
    }
  }, [entries]);

  useEffect(() => {
    window.sessionStorage.setItem(
      JOURNAL_UI_STATE_KEY,
      JSON.stringify({
        editId,
        editDate,
        editProfit,
        editWithdrawal,
        editNotes,
        dateFrom,
        dateTo,
        selectedMonth,
      }),
    );
  }, [editId, editDate, editProfit, editWithdrawal, editNotes, dateFrom, dateTo, selectedMonth]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    entries.forEach((entry) => months.add(entry.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let filtered = entries;

    if (selectedMonth !== 'all') {
      filtered = filtered.filter((entry) => entry.date.startsWith(selectedMonth));
    }
    if (dateFrom) {
      filtered = filtered.filter((entry) => entry.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((entry) => entry.date <= dateTo);
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
    setEditDate(entry.date);
    setEditProfit(entry.profitAmount.toString());
    setEditWithdrawal((entry.withdrawal || 0).toString());
    setEditNotes(entry.notes);
  };

  const cancelEdit = () => {
    window.sessionStorage.removeItem(JOURNAL_UI_STATE_KEY);
    setEditId(null);
    setEditDate('');
    setEditProfit('');
    setEditWithdrawal('');
    setEditNotes('');
  };

  const saveEdit = (id: string) => {
    const profitAmount = parseDecimalInput(editProfit);
    if (isNaN(profitAmount) || !editDate) return;

    const withdrawal = parseDecimalInput(editWithdrawal) || 0;
    window.sessionStorage.removeItem(JOURNAL_UI_STATE_KEY);
    onUpdate(id, {
      date: editDate,
      profitAmount,
      withdrawal,
      notes: editNotes,
    });

    setEditId(null);
    setEditDate('');
    setEditProfit('');
    setEditWithdrawal('');
    setEditNotes('');
  };

  const reversed = [...filteredEntries].reverse();
  const hasHiddenEntries = reversed.length > JOURNAL_PREVIEW_COUNT;
  const shouldForceExpand = Boolean(editId) || hasFilters;
  const visibleEntries =
    showAllEntries || shouldForceExpand ? reversed : reversed.slice(0, JOURNAL_PREVIEW_COUNT);

  return (
    <Card className="animate-fade-in card-elevated" style={{ animationDelay: '200ms' }}>
      <CardHeader className="flex flex-col gap-4 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Trading Journal</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => setIsCollapsed((current) => !current)}
            >
              <span>{isCollapsed ? 'Expand journal' : 'Collapse journal'}</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
              />
            </Button>
            {hasHiddenEntries && !shouldForceExpand && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-muted-foreground"
                onClick={() => setShowAllEntries((current) => !current)}
              >
                <span>{showAllEntries ? 'Show less' : `Show all (${reversed.length})`}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showAllEntries ? 'rotate-180' : ''}`}
                />
              </Button>
            )}
            <AddEntryDialog onAdd={onAdd} />
          </div>
        </div>

        {!isCollapsed && (
          <div className="flex flex-wrap items-end gap-3">
          <div className="flex h-8 items-center gap-1.5 self-end text-xs font-medium text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Filters
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">From</label>
            <Input
              type="date"
              lang="en-GB"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setSelectedMonth('all');
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">To</label>
            <Input
              type="date"
              lang="en-GB"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setSelectedMonth('all');
              }}
              className="h-8 w-36 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Month</label>
            <Select
              value={selectedMonth}
              onValueChange={(value) => {
                setSelectedMonth(value);
                setDateFrom('');
                setDateTo('');
              }}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {monthOptions.map((month) => (
                  <SelectItem key={month} value={month}>
                    {formatMonthOption(month)}
                  </SelectItem>
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
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isCollapsed ? (
          <div className="flex items-center justify-between px-6 py-4 text-sm text-muted-foreground">
            <span>
              {entries.length === 0
                ? 'No journal entries yet.'
                : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} hidden`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setIsCollapsed(false)}
            >
              <span>Show journal</span>
              <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
            </Button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">
              {entries.length === 0
                ? 'No entries yet. Add your first trading day!'
                : 'No entries match the selected filters.'}
            </p>
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
                  <TableHead className="text-xs w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleEntries.map((entry) => (
                  <TableRow key={entry.id} className="transition-colors">
                    <TableCell className="font-mono text-xs text-foreground">
                      {editId === entry.id ? (
                        <Input
                          type="date"
                          lang="en-GB"
                          value={editDate}
                          onChange={(event) => setEditDate(event.target.value)}
                          className="h-7 w-[132px] font-mono text-xs"
                        />
                      ) : (
                        formatDisplayDate(entry.date)
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {editId === entry.id ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editProfit}
                          onChange={(event) => setEditProfit(event.target.value)}
                          className="ml-auto h-7 w-24 font-mono text-right text-xs"
                        />
                      ) : (
                        <span
                          className={`font-mono text-sm font-medium ${
                            entry.profitAmount >= 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {showProfitAmounts
                            ? `${entry.profitAmount >= 0 ? '+' : ''}${entry.profitAmount.toFixed(2)}`
                            : '••••••'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell
                      className={`text-right font-mono text-xs ${
                        entry.profitPercent >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {entry.profitPercent >= 0 ? '+' : ''}
                      {entry.profitPercent.toFixed(2)}%
                    </TableCell>

                    <TableCell className="text-right">
                      {editId === entry.id ? (
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={editWithdrawal}
                          onChange={(event) => setEditWithdrawal(event.target.value)}
                          className="ml-auto h-7 w-24 font-mono text-right text-xs"
                        />
                      ) : (
                        <span
                          className={`font-mono text-xs ${
                            (entry.withdrawal || 0) > 0 ? 'text-warning' : 'text-muted-foreground'
                          }`}
                        >
                          {(entry.withdrawal || 0) > 0
                            ? `-${(entry.withdrawal || 0).toFixed(2)}`
                            : '—'}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs text-foreground">
                      {showBalance
                        ? `$${entry.endingBalance.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}`
                        : '••••••'}
                    </TableCell>

                    <TableCell className="max-w-[200px] truncate text-xs">
                      {editId === entry.id ? (
                        <Input
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          className="h-7 text-xs"
                          placeholder="Notes..."
                        />
                      ) : (
                        <span className="text-muted-foreground">{entry.notes || '—'}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {editId === entry.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-success hover:text-success"
                              onClick={() => saveEdit(entry.id)}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={cancelEdit}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => startEdit(entry)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onDelete(entry.id)}
                            >
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
        {!isCollapsed && hasHiddenEntries && !showAllEntries && !shouldForceExpand && (
          <div className="border-t px-6 py-3 text-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground"
              onClick={() => setShowAllEntries(true)}
            >
              <span>Show {reversed.length - JOURNAL_PREVIEW_COUNT} older entries</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
