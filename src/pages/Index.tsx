import { useTrading } from '@/hooks/useTrading';
import { useAuth } from '@/hooks/useAuth';
import SetupDeposit from '@/components/SetupDeposit';
import Dashboard from '@/components/Dashboard';
import Auth from '@/pages/Auth';
import { TradingProfile } from '@/lib/types';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const {
    profile, entries, currentBalance, loading: dataLoading,
    saveProfile, addEntry, updateEntry, deleteEntry, clearAll,
  } = useTrading();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Завантаження...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Завантаження даних...</div>
      </div>
    );
  }

  const handleSetup = (p: TradingProfile) => saveProfile(p);

  if (!profile) {
    return <SetupDeposit onSetup={handleSetup} />;
  }

  return (
    <Dashboard
      profile={profile}
      entries={entries}
      currentBalance={currentBalance}
      onAddEntry={addEntry}
      onUpdateEntry={updateEntry}
      onDeleteEntry={deleteEntry}
      onUpdateDeposit={saveProfile}
      onClearAll={clearAll}
    />
  );
}
