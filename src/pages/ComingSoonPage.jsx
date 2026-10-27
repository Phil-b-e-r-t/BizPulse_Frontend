import { Link, useLocation } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import { NAV_ITEMS, titleFor } from '../config/navigation';
import EmptyState from '../components/ui/EmptyState';

// Honest placeholder for modules that belong to the next milestone. No fake data.
export default function ComingSoonPage() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  const known = NAV_ITEMS.some((i) => pathname.startsWith(i.to) && i.to !== '/');
  return (
    <div className="card mx-auto max-w-xl">
      <EmptyState
        icon={Hammer}
        title={known ? `${title} is coming in the next release` : 'Page not found'}
        message={known ? 'This screen is not built yet. Everything you record elsewhere will show up here once it is.' : 'The page you are looking for does not exist.'}
        action={<Link to="/" className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">Back to dashboard</Link>}
      />
    </div>
  );
}
