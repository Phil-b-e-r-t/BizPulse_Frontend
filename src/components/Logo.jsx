import { useState } from 'react';

// Put your logo at: public/brand/logo.png (see README). If the file is missing, the built-in mark is shown.
export function LogoMark({ className = 'h-8 w-8' }) {
  const [broken, setBroken] = useState(false);
  if (!broken) {
    return <img src="/brand/logo.png" alt="" className={`${className} object-contain`} onError={() => setBroken(true)} />;
  }
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0F6B4F" />
      <path d="M5 17h5l3-7 5 13 3-6h6" fill="none" stroke="#D99A00" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const SIZES = {
  md: { mark: 'h-8 w-8', text: 'text-lg font-bold' },
  lg: { mark: 'h-12 w-12', text: 'text-4xl font-extrabold' },
};

export default function Logo({ tone = 'dark', size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={s.mark} />
      <span className={`${s.text} tracking-tight ${tone === 'light' ? 'text-white' : 'text-ink'}`}>BizPulse</span>
    </span>
  );
}
