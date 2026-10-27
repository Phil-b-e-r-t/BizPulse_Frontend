import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function Dialog({ open, onClose, title, description, children, wide = false }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  const titleId = useId();
  const descriptionId = useId();
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusable = () => [...(panel?.querySelectorAll(FOCUSABLE) || [])];
    (focusable()[0] || panel)?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/45 p-4 sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeRef.current(); }}
    >
      <section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative mx-auto my-4 w-full rounded-lg border border-ink-200 bg-white shadow-pop sm:my-10 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
      >
        <div className="flex items-start gap-4 border-b border-ink-100 px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm leading-6 text-ink-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => closeRef.current()}
            aria-label="Close dialog"
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
