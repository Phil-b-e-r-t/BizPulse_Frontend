import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { MessageSquareText, Boxes, LineChart } from 'lucide-react';
import Logo from '../components/Logo';

const POINTS = [
  { icon: MessageSquareText, text: 'Sales sent on WhatsApp land in your records' },
  { icon: Boxes, text: 'Stock goes down as you sell, with alerts when it runs low' },
  { icon: LineChart, text: 'See revenue, expenses and profit for today, this week or this month' },
];

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Optional photo: place at public/brand/auth-hero.jpg. Hidden automatically if the file is missing. */}
        <img src="/brand/auth-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="relative"><Logo tone="light" /></div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Your WhatsApp is already your business. We turn it into your books.</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-ink-200">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ochre" aria-hidden="true" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-ink-400">Built for shops, salons and traders across Uganda.</p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <Link to="/login" className="mb-8 inline-flex rounded lg:hidden" aria-label="BizPulse home"><Logo /></Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
