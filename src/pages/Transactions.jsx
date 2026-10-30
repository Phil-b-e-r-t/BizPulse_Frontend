import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReceiptText } from 'lucide-react';
import { friendlyError } from '../api/errors';
import { listTransactions, voidTransaction } from '../api/transactions';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatMoney } from '../utils/format';

const CHANNEL_LABELS = { pos: 'Pos', whatsapp: 'WhatsApp', web: 'Web', import: 'Import' };
const STATUS_TONES = { confirmed: 'green', needs_review: 'amber', voided: 'red' };

function statusLabel(status) {
  if (status === 'needs_review') return 'Needs review';
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
}

export default function TransactionsPage() {
  const { business, isOwner } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState('');
  const [channel, setChannel] = useState('');

  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'list', type, channel],
    queryFn: () => listTransactions({
      page: 1,
      limit: 50,
      type: type || undefined,
      channel: channel || undefined,
    }),
  });

  const voidMutation = useMutation({
    mutationFn: voidTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      push('Transaction voided', 'success');
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });

  useEffect(() => { document.title = 'Transactions · BizPulse'; }, []);

  const transactions = transactionsQuery.data?.items || [];
  const currency = business?.currency || 'UGX';

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-ink-500">Sales and expenses recorded by your business</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            Type
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="h-10 rounded-md border border-ink-300 bg-white px-3 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All</option>
              <option value="sale">Sale</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink-600">
            Channel
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              className="h-10 rounded-md border border-ink-300 bg-white px-3 text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All</option>
              <option value="pos">Pos</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="web">Web</option>
              <option value="import">Import</option>
            </select>
          </label>
        </div>
      </div>

      <section className="card overflow-hidden" aria-label="Transactions">
        {transactionsQuery.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading transactions">
            {[0, 1, 2, 3, 4].map((row) => <Skeleton key={row} className="h-12" />)}
          </div>
        ) : transactionsQuery.isError ? (
          <ErrorState
            title="Could not load transactions"
            message={friendlyError(transactionsQuery.error)}
            onRetry={() => transactionsQuery.refetch()}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No transactions found"
            message="Try changing the filters or check back after a sale or expense is recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Channel</th>
                  <th scope="col" className="px-4 py-3 text-right">Amount</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  {isOwner && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-600">
                      {formatDateTime(transaction.occurredAt || transaction.createdAt, business?.timezone)}
                    </td>
                    <td className="px-4 py-3 font-medium capitalize">{transaction.type || 'Unknown'}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {CHANNEL_LABELS[transaction.channel] || transaction.channel || 'Unknown'}
                    </td>
                    <td className="num whitespace-nowrap px-4 py-3 text-right font-semibold">
                      {formatMoney(transaction.amount, currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONES[transaction.status] || 'neutral'}>{statusLabel(transaction.status)}</Badge>
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3 text-right">
                        {transaction.status === 'confirmed' && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={voidMutation.isPending && voidMutation.variables === transaction.id}
                            disabled={voidMutation.isPending}
                            onClick={() => voidMutation.mutate(transaction.id)}
                          >
                            Void
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}