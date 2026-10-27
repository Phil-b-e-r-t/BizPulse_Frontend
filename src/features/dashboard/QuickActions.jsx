import { Link } from 'react-router-dom';
import { PackagePlus, Receipt, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ACTIONS = [
  { to: '/sell', label: 'New sale', icon: ShoppingCart, roles: ['owner', 'staff'], primary: true },
  { to: '/expenses', label: 'Add expense', icon: Receipt, roles: ['owner', 'staff'] },
  { to: '/inventory', label: 'Add product', icon: PackagePlus, roles: ['owner', 'staff'] },
];

export default function QuickActions() {
  const { user } = useAuth();
  const actions = ACTIONS.filter((a) => a.roles.includes(user?.role));
  if (actions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ to, label, icon: Icon, primary }) => (
        <Link
          key={to}
          to={to}
          className={`inline-flex h-10 items-center gap-2 rounded-md px-3.5 text-sm font-semibold ${
            primary ? 'bg-brand text-white hover:bg-brand-dark' : 'border border-ink-300 bg-white hover:bg-ink-100'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />{label}
        </Link>
      ))}
    </div>
  );
}
