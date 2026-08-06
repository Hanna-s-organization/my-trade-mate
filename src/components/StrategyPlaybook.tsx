import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type StrategyNote = {
  id: string;
  asset: string;
  strategy: string;
  tradingWindow: string;
  bestEntry: string;
  stopTrading: string;
  emotionalNotes: string;
  notes: string;
  updatedAt: string;
};

type DraftState = Omit<StrategyNote, 'id' | 'updatedAt'>;

const PLAYBOOK_STORAGE_KEY = 'tradely-strategy-playbook';

const emptyDraft = (): DraftState => ({
  asset: '',
  strategy: '',
  tradingWindow: '',
  bestEntry: '',
  stopTrading: '',
  emotionalNotes: '',
  notes: '',
});

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function StrategyPlaybook() {
  const [items, setItems] = useState<StrategyNote[]>([]);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(PLAYBOOK_STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as StrategyNote[];
      setItems(parsed);
    } catch {
      window.localStorage.removeItem(PLAYBOOK_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(PLAYBOOK_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isDraftValid = useMemo(() => draft.asset.trim() && draft.strategy.trim(), [draft.asset, draft.strategy]);

  const updateDraft = (field: keyof DraftState, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const resetDraft = () => {
    setDraft(emptyDraft());
    setEditingId(null);
  };

  const handleSave = () => {
    if (!isDraftValid) return;

    const nextItem: StrategyNote = {
      id: editingId ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      ...draft,
    };

    setItems((current) => {
      if (!editingId) {
        return [nextItem, ...current];
      }

      return current.map((item) => (item.id === editingId ? nextItem : item));
    });

    resetDraft();
  };

  const startEdit = (item: StrategyNote) => {
    setEditingId(item.id);
    setDraft({
      asset: item.asset,
      strategy: item.strategy,
      tradingWindow: item.tradingWindow,
      bestEntry: item.bestEntry,
      stopTrading: item.stopTrading,
      emotionalNotes: item.emotionalNotes,
      notes: item.notes,
    });
  };

  const handleDelete = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    if (editingId === id) {
      resetDraft();
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="card-elevated animate-fade-in">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-lg">Strategy Playbook</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Keep your trading rules, timing and setup notes by asset.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Asset
            </label>
            <Input
              value={draft.asset}
              onChange={(event) => updateDraft('asset', event.target.value)}
              placeholder="BTCUSD, XAUUSD, EURUSD..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Strategy
            </label>
            <Input
              value={draft.strategy}
              onChange={(event) => updateDraft('strategy', event.target.value)}
              placeholder="Breakout, pullback, scalp..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Trading Window
            </label>
            <Input
              value={draft.tradingWindow}
              onChange={(event) => updateDraft('tradingWindow', event.target.value)}
              placeholder="London open, first 2 hours, after NY open..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Best Entry
            </label>
            <Textarea
              value={draft.bestEntry}
              onChange={(event) => updateDraft('bestEntry', event.target.value)}
              placeholder="What should be present before entering a trade?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Stop Trading When
            </label>
            <Textarea
              value={draft.stopTrading}
              onChange={(event) => updateDraft('stopTrading', event.target.value)}
              placeholder="When should you stop for the day or skip this setup?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Emotional Notes
            </label>
            <Textarea
              value={draft.emotionalNotes}
              onChange={(event) => updateDraft('emotionalNotes', event.target.value)}
              placeholder="How should you feel before entering? What emotional warnings matter here?"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </label>
            <Textarea
              value={draft.notes}
              onChange={(event) => updateDraft('notes', event.target.value)}
              placeholder="Extra execution notes, filters, context..."
              rows={5}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" className="flex-1 gap-2" onClick={handleSave} disabled={!isDraftValid}>
              {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingId ? 'Save Changes' : 'Add Strategy'}
            </Button>
            {(editingId || draft.asset || draft.strategy || draft.tradingWindow || draft.bestEntry || draft.stopTrading || draft.emotionalNotes || draft.notes) && (
              <Button type="button" variant="ghost" className="gap-2" onClick={resetDraft}>
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {items.length === 0 ? (
          <Card className="card-elevated animate-fade-in">
            <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-3 p-8 text-center">
              <BookOpen className="h-8 w-8 text-primary/70" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">No strategy notes yet</p>
                <p className="text-sm text-muted-foreground">
                  Add your first asset playbook on the left to build your personal trading plan.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((item) => (
              <Card key={item.id} className="card-elevated animate-fade-in">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-primary">
                        {item.asset}
                      </p>
                      <CardTitle className="text-lg">{item.strategy}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Updated {formatUpdatedAt(item.updatedAt)}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Trading Window
                    </p>
                    <p className="text-sm text-foreground">{item.tradingWindow || 'Not specified yet'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Best Entry
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {item.bestEntry || 'No entry notes yet'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Stop Trading When
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {item.stopTrading || 'No stop conditions yet'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Emotional Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {item.emotionalNotes || 'No emotional notes yet'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {item.notes || 'No extra notes yet'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
