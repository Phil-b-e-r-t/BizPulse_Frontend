import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listWhatsAppMessages } from '../api/whatsapp';
import { friendlyError } from '../api/errors';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { formatDateTime, formatPhoneNumber } from '../utils/format';

const SENDER_ROLES = ['owner', 'staff', 'customer', 'business', 'unknown'];
const AI_STATUSES = ['queued', 'processing', 'processed', 'ignored', 'failed', 'pending'];
const ROLE_TONES = { owner: 'green', staff: 'blue', customer: 'amber', business: 'teal', unknown: 'neutral' };
const AI_TONES = { queued: 'amber', processing: 'blue', processed: 'green', ignored: 'neutral', failed: 'red', pending: 'neutral' };

function labelFor(value) {
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function Messages() {
  const [aiStatus, setAiStatus] = useState('');
  const [senderRole, setSenderRole] = useState('');
  const messagesQuery = useQuery({
    queryKey: ['whatsapp', 'messages'],
    queryFn: () => listWhatsAppMessages({ page: 1, limit: 50 }),
  });

  useEffect(() => { document.title = 'Messages · BizPulse'; }, []);

  const messages = messagesQuery.data?.items || [];
  const filteredMessages = messages.filter((message) => {
    const role = message.senderRole || 'unknown';
    const status = message.aiStatus || 'pending';
    return (!senderRole || role === senderRole) && (!aiStatus || status === aiStatus);
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-ink-500">WhatsApp conversations and processing status</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            AI status
            <select
              value={aiStatus}
              onChange={(event) => setAiStatus(event.target.value)}
              className="h-10 rounded-md border border-ink-300 bg-white px-3 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All</option>
              {AI_STATUSES.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            Sender role
            <select
              value={senderRole}
              onChange={(event) => setSenderRole(event.target.value)}
              className="h-10 rounded-md border border-ink-300 bg-white px-3 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All</option>
              {SENDER_ROLES.map((role) => <option key={role} value={role}>{labelFor(role)}</option>)}
            </select>
          </label>
        </div>
      </div>

      <section className="card overflow-hidden" aria-label="WhatsApp messages">
        {messagesQuery.isPending ? (
          <div className="space-y-4 p-4 sm:p-5" role="status" aria-label="Loading messages">
            {[0, 1, 2, 3].map((row) => <Skeleton key={row} className="h-24" />)}
          </div>
        ) : messagesQuery.isError ? (
          <ErrorState
            title="Could not load messages"
            message={friendlyError(messagesQuery.error)}
            onRetry={() => messagesQuery.refetch()}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            message="Messages sent to your WhatsApp business number will appear here."
          />
        ) : filteredMessages.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No matching messages"
            message="Try changing the sender role or AI status filters."
            compact
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {filteredMessages.map((message) => {
              const role = SENDER_ROLES.includes(message.senderRole) ? message.senderRole : 'unknown';
              const status = AI_STATUSES.includes(message.aiStatus) ? message.aiStatus : 'pending';
              return (
                <li key={message.id} className="flex gap-3 p-4 sm:gap-4 sm:p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark" aria-hidden="true">
                    {initials(message.contactName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-ink">{message.contactName || 'Unknown contact'}</h2>
                        <p className="mt-0.5 text-xs text-ink-500">{formatPhoneNumber(message.contactPhone)}</p>
                      </div>
                      <time dateTime={message.sentAt} className="shrink-0 text-xs text-ink-500">
                        {formatDateTime(message.sentAt)}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap break-words rounded-md bg-ink-50 px-3 py-2.5 text-sm leading-6 text-ink-700">
                      {message.body || 'No message text'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={ROLE_TONES[role]}>{labelFor(role)}</Badge>
                      <Badge tone={AI_TONES[status]}>{labelFor(status)}</Badge>
                      {status === 'processed' && message.aiNote && (
                        <span className="text-xs text-ink-500">{message.aiNote}</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}