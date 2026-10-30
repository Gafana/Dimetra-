import { Home, PlusCircle, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { BrandLogo } from './BrandLogo.js';

function NavItem({
  to,
  end,
  icon: Icon,
  label,
}: {
  to: string;
  end?: boolean;
  icon: typeof Home;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition-all',
          isActive ? 'nav-pill-active text-sage-100' : 'text-sage-400/80',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-9 w-9 items-center justify-center rounded-full transition-all',
              isActive ? 'bg-sage-400/20' : '',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  return (
    <div className="relative flex min-h-full flex-col text-sage-100">
      <div className="app-bg" aria-hidden />

      <header className="sticky top-0 z-10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <GlassHeader />
      </header>

      <main className="flex-1 px-4 pb-28 pt-2">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="glass flex gap-1 rounded-[1.75rem] px-2 py-2">
          <NavItem to="/" end icon={Home} label="Главная" />
          <NavItem to="/add-plant" icon={PlusCircle} label="Добавить" />
          <NavItem to="/settings" icon={Settings} label="Настройки" />
        </div>
      </nav>
    </div>
  );
}

function GlassHeader() {
  return (
    <div className="glass flex items-center justify-between rounded-[1.5rem] px-4 py-3">
      <div className="w-10" />
      <BrandLogo compact />
      <div className="w-10" />
    </div>
  );
}
