import { NavLink } from 'react-router-dom';
import Logo from '../components/Logo';
import { NAV_ITEMS, canSee } from '../config/navigation';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, business } = useAuth();
  const items = NAV_ITEMS.filter((i) => canSee(i, user?.role));

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-ink lg:flex">
      <div className="px-5 py-5"><Logo tone="light" /></div>
      <nav aria-label="Main" className="flex-1 space-y-0.5 px-3">
        {items.map(({ to, label, icon: Icon, end, built }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-offset-ink ${
                isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:bg-ink-800/60 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-ochre" aria-hidden="true" />}
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                <span className="flex-1">{label}</span>
                {!built && <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-medium text-ink-300">Soon</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-ink-700 px-5 py-4">
        <p className="truncate text-sm font-semibold text-white">{business?.name}</p>
        <p className="truncate text-xs capitalize text-ink-400">{user?.name} · {user?.role}</p>
      </div>
    </aside>
  );
}
