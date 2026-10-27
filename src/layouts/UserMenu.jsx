import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ui/Toast';

export default function UserMenu() {
  const { user, business, logout } = useAuth();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const initials = (user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-ink-100"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight">{user?.name}</span>
          <span className="block text-xs capitalize leading-tight text-ink-500">{user?.role}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-ink-500" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-64 rounded-lg border border-ink-200 bg-white p-1 shadow-pop">
          <div className="border-b border-ink-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{business?.name}</p>
            <p className="truncate text-xs text-ink-500">{user?.email}</p>
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); logout(); push('You have signed out', 'info'); }}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-800 hover:bg-ink-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
