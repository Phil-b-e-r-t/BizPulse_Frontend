import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

// Background slideshow: place four photos at public/brand/auth-bg-1.jpg ... auth-bg-4.jpg.
// Any missing file is hidden automatically.
const BACKGROUNDS = [1, 2, 3, 4].map((n) => `/brand/auth-bg-${n}.jpg`);
const SLIDE_SECONDS = 6;

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden="true" className="absolute inset-0">
          {BACKGROUNDS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="absolute inset-0 h-full w-full animate-auth-slide object-cover opacity-0 motion-reduce:animate-none motion-reduce:first:opacity-30"
              style={{ animationDelay: `${i * SLIDE_SECONDS}s` }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ))}
        </div>
        <div className="relative"><Logo tone="light" /></div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">Your WhatsApp is already your business. We turn it into your books.</h2>
        </div>
        <p className="relative text-sm text-ink-400">Built for shops, salons and traders across Uganda.</p>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-[21rem]">
          <Link to="/login" className="mb-8 inline-flex rounded lg:hidden" aria-label="BizPulse home"><Logo /></Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
