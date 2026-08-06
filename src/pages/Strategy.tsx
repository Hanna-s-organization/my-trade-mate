import AppHeader from '@/components/AppHeader';
import StrategyPlaybook from '@/components/StrategyPlaybook';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';
import { useAuth } from '@/hooks/useAuth';
import Auth from './Auth';

export default function StrategyPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        actions={
          <>
            <ThemeToggle />
            <UserMenu />
          </>
        }
      />

      <main className="container mx-auto space-y-6 px-4 py-6">
        <div className="space-y-1">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
            Strategy Workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Build your personal trading playbook
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Keep your strategy, rules, emotional reminders and setup notes on a separate page from the trading journal.
          </p>
        </div>

        <StrategyPlaybook />
      </main>
    </div>
  );
}
