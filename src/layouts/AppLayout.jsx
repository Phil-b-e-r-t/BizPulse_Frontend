import { Outlet, useLocation } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import UserMenu from './UserMenu';
import { LogoMark } from '../components/Logo';
import { titleFor } from '../config/navigation';
import { env } from '../config/env';

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {env.useMocks && (
          <div className="flex items-center justify-center gap-2 bg-ochre-soft px-4 py-1.5 text-xs font-medium text-ochre-dark">
            <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
            Sample data for development. These figures are not real business records.
          </div>
        )}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-ink-200 bg-paper/95 px-4 backdrop-blur lg:h-16 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="lg:hidden"><LogoMark className="h-7 w-7" /></span>
            <h1 className="text-lg font-bold tracking-tight lg:text-xl">{title}</h1>
          </div>
          <UserMenu />
        </header>
        <main id="main" className="flex-1 px-4 pb-24 pt-5 lg:px-8 lg:pb-10 lg:pt-7">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
