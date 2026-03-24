import { useTrading } from '@/hooks/useTrading';
import SetupDeposit from '@/components/SetupDeposit';
import Dashboard from '@/components/Dashboard';
import { TradingProfile } from '@/lib/types';

export default function Index() {
  const {
    profile, entries, currentBalance,
    saveProfile, addEntry, updateEntry, deleteEntry, clearAll,
  } = useTrading();

  const handleSetup = (p: TradingProfile) => saveProfile(p);
  const handleLoadDemo = () => window.location.reload();

  if (!profile) {
    return <SetupDeposit onSetup={handleSetup} onLoadDemo={handleLoadDemo} />;
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
