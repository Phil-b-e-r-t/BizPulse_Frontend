import { useEffect } from 'react';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addSender, connectWhatsApp, getWhatsAppStatus, listSenders, removeSender } from '../api/whatsapp';
import { friendlyError } from '../api/errors';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import AddSenderForm from '../features/whatsapp/AddSenderForm';
import WhatsAppConnectForm from '../features/whatsapp/WhatsAppConnectForm';
import { formatPhoneNumber } from '../utils/format';

export default function WhatsAppSettingsPage() {
  const { isOwner } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: getWhatsAppStatus,
  });
  const sendersQuery = useQuery({
    queryKey: ['whatsapp', 'senders'],
    queryFn: listSenders,
  });

  const connectMutation = useMutation({
    mutationFn: connectWhatsApp,
    onSuccess: async () => {
      push('WhatsApp connected', 'success');
      await queryClient.invalidateQueries({ queryKey: ['whatsapp', 'status'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });
  const addMutation = useMutation({
    mutationFn: addSender,
    onSuccess: async () => {
      push('Staff number added', 'success');
      await queryClient.invalidateQueries({ queryKey: ['whatsapp', 'senders'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });
  const removeMutation = useMutation({
    mutationFn: removeSender,
    onSuccess: async () => {
      push('Staff number removed', 'success');
      await queryClient.invalidateQueries({ queryKey: ['whatsapp', 'senders'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });

  useEffect(() => { document.title = 'WhatsApp settings · BizPulse'; }, []);

  const connected = statusQuery.data?.connected === true;
  const senders = sendersQuery.data?.items || [];

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="card p-4 sm:p-5" aria-labelledby="whatsapp-connection-title">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
            <MessageSquare className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="whatsapp-connection-title" className="text-base font-semibold">WhatsApp connection</h2>
            {statusQuery.isPending ? (
              <Skeleton className="mt-3 h-12 max-w-lg" />
            ) : statusQuery.isError ? (
              <ErrorState compact title="Could not load connection status" message={friendlyError(statusQuery.error)} onRetry={() => statusQuery.refetch()} />
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge tone={connected ? 'green' : 'neutral'}>
                  <span className="inline-flex items-center gap-1.5">
                    {connected ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <XCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {connected ? 'Connected' : 'Not connected'}
                  </span>
                </Badge>
                {connected && (statusQuery.data.account?.displayPhoneNumber || statusQuery.data.account?.phoneNumberId) && (
                  <span className="text-sm text-ink-500">
                    {statusQuery.data.account.displayPhoneNumber || statusQuery.data.account.phoneNumberId}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {!statusQuery.isPending && !statusQuery.isError && !connected && (
          <div className="mt-5 border-t border-ink-100 pt-5">
            {isOwner ? (
              <>
                <h3 className="mb-4 text-sm font-semibold">Connect a WhatsApp Business account</h3>
                <WhatsAppConnectForm onConnect={connectMutation.mutateAsync} isSubmitting={connectMutation.isPending} />
              </>
            ) : (
              <p className="text-sm text-ink-500">Ask a business owner to connect WhatsApp.</p>
            )}
          </div>
        )}
      </section>

      <section className="card overflow-hidden" aria-labelledby="senders-title">
        <div className="border-b border-ink-100 px-4 py-4 sm:px-5">
          <h2 id="senders-title" className="text-base font-semibold">Staff numbers</h2>
          <p className="mt-1 text-sm text-ink-500">Numbers authorized to use WhatsApp for this business</p>
        </div>

        {sendersQuery.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading staff numbers">
            {[0, 1, 2].map((row) => <Skeleton key={row} className="h-12" />)}
          </div>
        ) : sendersQuery.isError ? (
          <ErrorState title="Could not load staff numbers" message={friendlyError(sendersQuery.error)} onRetry={() => sendersQuery.refetch()} />
        ) : senders.length === 0 ? (
          <EmptyState compact title="No staff numbers yet" message="Add a number to authorize a team member." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {senders.map((sender) => (
              <li key={sender.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{formatPhoneNumber(sender.phone || sender.phoneNumber)}</p>
                  <p className="mt-0.5 text-sm text-ink-500">
                    <span className="capitalize">{sender.role}</span>{sender.label ? ` · ${sender.label}` : ''}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={removeMutation.isPending && removeMutation.variables === sender.id}
                    disabled={removeMutation.isPending}
                    aria-label={`Remove ${formatPhoneNumber(sender.phone || sender.phoneNumber)}`}
                    onClick={() => removeMutation.mutate(sender.id)}
                  >
                    Remove
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {isOwner && (
          <div className="border-t border-ink-100 p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold">Add staff number</h3>
            <AddSenderForm onAdd={addMutation.mutateAsync} isSubmitting={addMutation.isPending} />
          </div>
        )}
      </section>
    </div>
  );
}