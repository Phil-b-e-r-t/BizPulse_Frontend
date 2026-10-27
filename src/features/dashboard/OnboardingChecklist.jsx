import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getWhatsAppStatus, listSenders } from '../../api/whatsapp';
import { useProductCount } from '../../hooks/useDashboardData';
import { useAuth } from '../../context/AuthContext';

// Handoff section 6: 1 Add products, 2 Connect WhatsApp, 3 Add staff numbers, 4 Record first sale.
// `done` is undefined when we can't tell (e.g. the WhatsApp endpoints failed), so we never claim a false tick.
export default function OnboardingChecklist({ hasTransactions }) {
  const { isOwner } = useAuth();
  const products = useProductCount();
  const wa = useQuery({ queryKey: ['whatsapp', 'status'], queryFn: getWhatsAppStatus, enabled: isOwner, retry: false });
  const senders = useQuery({ queryKey: ['whatsapp', 'senders'], queryFn: listSenders, enabled: isOwner, retry: false });

  const steps = [
    { label: 'Add your products', to: '/inventory', done: products.isSuccess ? products.data > 0 : undefined },
    isOwner && { label: 'Connect WhatsApp', to: '/settings', done: wa.isSuccess ? wa.data.connected : undefined },
    isOwner && { label: 'Add staff numbers', to: '/settings', done: senders.isSuccess ? senders.data.items.some((s) => s.role === 'staff') : undefined },
    { label: 'Record or send your first sale', to: '/sell', done: hasTransactions },
  ].filter(Boolean);

  const finished = steps.filter((s) => s.done).length;
  if (steps.every((s) => s.done)) return null;

  return (
    <section className="card border-brand/30 bg-brand-soft/40 p-4 lg:p-5" aria-labelledby="start-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="start-title" className="text-base font-semibold">Get started</h2>
        <p className="text-sm text-ink-500">{finished} of {steps.length} done</p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className="flex items-center gap-3 rounded-md bg-white px-3 py-3 text-sm font-medium ring-1 ring-ink-200 hover:ring-ink-300">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-brand text-white' : 'border-2 border-ink-300'}`}>
                {s.done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
              </span>
              <span className={s.done ? 'text-ink-500 line-through' : ''}>{s.label}</span>
              {s.done && <span className="sr-only">(done)</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
