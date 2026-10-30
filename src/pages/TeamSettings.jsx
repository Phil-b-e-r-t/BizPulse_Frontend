import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, UserPlus } from 'lucide-react';
import { cancelTeamInvite, createTeamInvite, listTeamInvites, listTeamMembers, resendTeamInvite, updateTeamMember } from '../api/team';
import { friendlyError } from '../api/errors';
import Button from '../components/ui/Button';
import Dialog from '../components/ui/Dialog';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import Field from '../components/ui/Field';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';

function InviteMemberDialog({ open, onClose, onInvite, isSubmitting }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting: isFormSubmitting } } = useForm({ defaultValues: { role: 'staff' } });

  useEffect(() => {
    if (open) reset({ name: '', email: '', role: 'staff', phone: '' });
  }, [open, reset]);

  const submit = async (values) => {
    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      role: values.role,
      ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
    };
    try {
      await onInvite(payload);
    } catch {
      return;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Invite a team member" description="They will receive a link to join your business." wide>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" autoComplete="name" error={errors.name?.message} {...register('name', { required: 'Enter their name' })} />
          <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email', {
            required: 'Enter their email',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })} />
          <div>
            <label htmlFor="invite-role" className="mb-1.5 block text-sm font-medium text-ink-800">Role</label>
            <select
              id="invite-role"
              className="h-11 w-full rounded-md border border-ink-300 bg-white px-3 text-base text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              {...register('role', { required: 'Choose a role' })}
            >
              <option value="staff">Staff</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>
          <Field label="Phone" type="tel" autoComplete="tel" optional error={errors.phone?.message} {...register('phone')} />
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-ink-100 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || isFormSubmitting}>
            {isSubmitting || isFormSubmitting ? 'Sending invite' : 'Send invite'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function InviteLinkDialog({ inviteUrl, onClose, push }) {
  if (!inviteUrl) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      push('Invite link copied', 'success');
    } catch {
      push('Could not copy the invite link', 'error');
    }
  };

  return (
    <Dialog open onClose={onClose} title="Invitation created" description="Share this link with the team member to complete their invitation.">
      <div className="space-y-4 p-5 sm:p-6">
        <p className="break-all rounded-md border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">{inviteUrl}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={copyLink}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy Link
          </Button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(inviteUrl)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Share on WhatsApp
          </a>
        </div>
      </div>
    </Dialog>
  );
}

function MemberRows({ members, onUpdate, isUpdating }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-ink-200 bg-ink-50 text-xs font-semibold uppercase text-ink-500">
          <tr>
            <th scope="col" className="px-4 py-3">Name</th>
            <th scope="col" className="px-4 py-3">Email</th>
            <th scope="col" className="px-4 py-3">Role</th>
            <th scope="col" className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {members.map((member) => (
            <tr key={member.id}>
              <td className="px-4 py-3 font-medium text-ink">{member.name || 'Unnamed member'}</td>
              <td className="px-4 py-3 text-ink-600">{member.email}</td>
              <td className="px-4 py-3">
                {member.role === 'owner' ? (
                  <span className="capitalize">{member.role}</span>
                ) : (
                  <select
                    aria-label={`Role for ${member.name || member.email}`}
                    value={member.role}
                    disabled={isUpdating}
                    onChange={(event) => onUpdate(member.id, { role: event.target.value })}
                    className="h-9 rounded-md border border-ink-300 bg-white px-2 text-sm capitalize text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-ink-50"
                  >
                    <option value="staff">Staff</option>
                    <option value="accountant">Accountant</option>
                  </select>
                )}
              </td>
              <td className="px-4 py-3">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={`Active status for ${member.name || member.email}`}
                    checked={Boolean(member.isActive)}
                    disabled={isUpdating}
                    onChange={(event) => onUpdate(member.id, { isActive: event.target.checked })}
                    className="peer sr-only"
                  />
                  <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-ink-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
                  <span className="text-xs text-ink-500">{member.isActive ? 'On' : 'Off'}</span>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TeamSettings() {
  const { isOwner } = useAuth();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');

  const membersQuery = useQuery({
    queryKey: ['team', 'members'],
    queryFn: listTeamMembers,
    enabled: isOwner,
  });
  const invitesQuery = useQuery({
    queryKey: ['team', 'invites'],
    queryFn: listTeamInvites,
    enabled: isOwner,
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, changes }) => updateTeamMember(id, changes),
    onSuccess: async (_, variables) => {
      push(variables.changes.role ? 'Member role updated' : 'Member status updated', 'success');
      await queryClient.invalidateQueries({ queryKey: ['team', 'members'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });
  const inviteMutation = useMutation({
    mutationFn: createTeamInvite,
    onSuccess: async () => {
      push('Invitation sent', 'success');
      await queryClient.invalidateQueries({ queryKey: ['team', 'invites'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });
  const resendMutation = useMutation({
    mutationFn: resendTeamInvite,
    onSuccess: () => push('Invitation resent', 'success'),
    onError: (error) => push(friendlyError(error), 'error'),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelTeamInvite,
    onSuccess: async () => {
      push('Invitation canceled', 'success');
      await queryClient.invalidateQueries({ queryKey: ['team', 'invites'] });
    },
    onError: (error) => push(friendlyError(error), 'error'),
  });

  useEffect(() => { document.title = 'Team settings · BizPulse'; }, []);

  if (!isOwner) return <Navigate to="/" replace />;

  const members = membersQuery.data?.items || [];
  const invites = invitesQuery.data?.items || [];

  const submitInvite = async (values) => {
    const result = await inviteMutation.mutateAsync(values);
    setInviteOpen(false);
    if (result?.inviteUrl) setInviteUrl(result.inviteUrl);
  };

  const updateMember = (id, changes) => updateMemberMutation.mutate({ id, changes });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="card overflow-hidden" aria-labelledby="team-members-title">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-4 sm:px-5">
          <div>
            <h2 id="team-members-title" className="text-base font-semibold">Members</h2>
            <p className="mt-1 text-sm text-ink-500">Manage access and roles for your team.</p>
          </div>
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Invite Member
          </Button>
        </div>
        {membersQuery.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading members">
            {[0, 1, 2].map((row) => <Skeleton key={row} className="h-12" />)}
          </div>
        ) : membersQuery.isError ? (
          <ErrorState title="Could not load members" message={friendlyError(membersQuery.error)} onRetry={() => membersQuery.refetch()} />
        ) : members.length === 0 ? (
          <EmptyState compact title="No members found" message="Invite a team member to get started." />
        ) : (
          <MemberRows members={members} onUpdate={updateMember} isUpdating={updateMemberMutation.isPending} />
        )}
      </section>

      <section className="card overflow-hidden" aria-labelledby="team-invites-title">
        <div className="border-b border-ink-100 px-4 py-4 sm:px-5">
          <h2 id="team-invites-title" className="text-base font-semibold">Pending Invitations</h2>
        </div>
        {invitesQuery.isPending ? (
          <div className="space-y-3 p-4" role="status" aria-label="Loading invitations">
            {[0, 1].map((row) => <Skeleton key={row} className="h-12" />)}
          </div>
        ) : invitesQuery.isError ? (
          <ErrorState title="Could not load invitations" message={friendlyError(invitesQuery.error)} onRetry={() => invitesQuery.refetch()} />
        ) : invites.length === 0 ? (
          <EmptyState compact title="No pending invitations" message="Invitations you send will appear here." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0 flex-1">
                  <p className="break-all font-medium text-ink">{invite.email}</p>
                  <p className="mt-0.5 text-sm capitalize text-ink-500">{invite.role}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={resendMutation.isPending && resendMutation.variables === invite.id}
                    disabled={resendMutation.isPending || cancelMutation.isPending}
                    onClick={() => resendMutation.mutate(invite.id)}
                  >
                    Resend
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    loading={cancelMutation.isPending && cancelMutation.variables === invite.id}
                    disabled={cancelMutation.isPending || resendMutation.isPending}
                    onClick={() => cancelMutation.mutate(invite.id)}
                  >
                    Cancel
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={submitInvite}
        isSubmitting={inviteMutation.isPending}
      />
      <InviteLinkDialog inviteUrl={inviteUrl} onClose={() => setInviteUrl('')} push={push} />
    </div>
  );
}