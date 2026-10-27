import { NavLink } from 'react-router-dom';
import { NAV_ITEMS, MOBILE_TABS, MORE_ITEM, canSee } from '../config/navigation';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const { user } = useAuth();
  const tabs = [...NAV_ITEMS.filter((i) => MOBILE_TABS.includes(i.to) && canSee(i, user?.role)), MORE_ITEM];

  return (
    <nav aria-label="Main (mobile)" className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="flex">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isActive ? 'text-brand' : 'text-ink-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
