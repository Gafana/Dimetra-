import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from './BrandLogo.js';
import { LocalDevBanner } from './LocalDevBanner.js';
import { BookOpen, CalendarDays, Home, PlusCircle, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

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
          'flex w-[4.75rem] shrink-0 snap-center flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-center text-[9px] font-medium leading-tight transition-all',
          isActive ? 'nav-pill-active text-sage-100' : 'text-sage-400/80',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-all',
              isActive ? 'bg-sage-400/20' : '',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}

function useCollapsingAppHeader() {
  const headerRef = useRef<HTMLElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) {
      return;
    }

    const syncHeight = () => {
      setHeaderOffset(header.offsetHeight);
    };

    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const deltaThreshold = 6;

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 0) {
        setHeaderHidden(false);
      } else if (currentY > lastScrollY + deltaThreshold) {
        setHeaderHidden(true);
      } else if (currentY < lastScrollY - deltaThreshold) {
        setHeaderHidden(false);
      }
      lastScrollY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return { headerRef, headerHidden, headerOffset };
}

export function Layout() {
  const { headerRef, headerHidden, headerOffset } = useCollapsingAppHeader();

  return (
    <div className="relative flex min-h-full flex-col text-sage-100">
      <div className="app-bg" aria-hidden />

      <header
        ref={headerRef}
        className={[
          'fixed left-0 right-0 top-0 z-10 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]',
          'transition-transform duration-300 ease-out will-change-transform',
          headerHidden ? '-translate-y-full' : 'translate-y-0',
        ].join(' ')}
      >
        <GlassHeader />
      </header>

      <main
        className="flex-1 px-4 pb-28 pt-2"
        style={{ paddingTop: headerOffset > 0 ? headerOffset + 8 : undefined }}
      >
        <LocalDevBanner />
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
        aria-label="Основная навигация"
      >
        <div className="modal-panel overflow-hidden rounded-[1.75rem] py-2">
          <div className="scrollbar-none flex snap-x snap-proximity gap-1 overflow-x-auto overscroll-x-contain scroll-px-3 px-3 touch-pan-x">
            <NavItem to="/" end icon={Home} label="Главная" />
            <NavItem to="/calendar" icon={CalendarDays} label="Календарь" />
            <NavItem to="/encyclopedia" icon={BookOpen} label="Энциклопедия" />
            <NavItem to="/add-plant" icon={PlusCircle} label="Добавить" />
            <NavItem to="/settings" icon={Settings} label="Настройки" />
          </div>
        </div>
      </nav>
    </div>
  );
}

function GlassHeader() {
  return (
    <div className="modal-panel flex items-center justify-between rounded-[1.5rem] px-4 py-3">
      <div className="w-10" />
      <BrandLogo compact />
      <div className="w-10" />
    </div>
  );
}
