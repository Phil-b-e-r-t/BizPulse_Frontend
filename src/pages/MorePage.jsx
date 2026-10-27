import { Link } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { NAV_ITEMS, MOBILE_TABS, canSee } from '../config/navigation';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

// Mobile "More" tab: everything that doesn't fit in the bottom bar, plus sign out.
export default function MorePage() {
  const { user, business, logout } = useAuth();
  const { push } = useToast();
  const items = NAV_ITEMS.filter((i) => !MOBILE_TABS.includes(i.to) && canSee(i, user?.role));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card p-4">
        <p className="font-semibold">{business?.name}</p>
        <p className="text-sm text-ink-500">{user?.name} · {user?.email}</p>
      </div>
      <ul className="card divide-y divide-ink-100">
        {items.map(({ to, label, icon: Icon, built }) => (
          <li key={to}>
            <Link to={to} className="flex h-14 items-center gap-3 px-4 hover:bg-ink-100/60">
              <Icon className="h-5 w-5 text-ink-500" aria-hidden="true" />
              <span className="flex-1 font-medium">{label}</span>
              {!built && <span className="text-xs text-ink-400">Soon</span>}
              <ChevronRight className="h-4 w-4 text-ink-300" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => { logout(); push('You have signed out', 'info'); }}
        className="card flex h-14 w-full items-center gap-3 px-4 font-medium text-brick hover:bg-brick-soft/50"
      >
        <LogOut className="h-5 w-5" aria-hidden="true" /> Sign out
      </button>
    </div>
  );
}
