import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import TradelyLogo from './TradelyLogo';

interface Props {
  actions?: ReactNode;
}

function navClassName(isActive: boolean) {
  return [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
  ].join(' ');
}

export default function AppHeader({ actions }: Props) {
  return (
    <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <TradelyLogo size={32} />
          <nav className="hidden items-center gap-1 rounded-xl bg-card/70 p-1 sm:flex">
            <NavLink to="/" end className={({ isActive }) => navClassName(isActive)}>
              Dashboard
            </NavLink>
            <NavLink to="/trades" className={({ isActive }) => navClassName(isActive)}>
              Trades
            </NavLink>
            <NavLink to="/database" className={({ isActive }) => navClassName(isActive)}>
              Database
            </NavLink>
            <NavLink to="/strategy" className={({ isActive }) => navClassName(isActive)}>
              Strategy
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
    </header>
  );
}
