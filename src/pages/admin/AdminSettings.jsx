import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings } from '../../api/admin';
import { friendlyError } from '../../api/errors';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/ui/ErrorState';
import Skeleton from '../../components/ui/Skeleton';
import { useToast } from '../../components/ui/Toast';
import { FieldRow, PageIntro, fmtStamp, inputCls } from '../../components/admin/ui';

const num = (min, max) => ({ required: 'Required', valueAsNumber: true, validate: (v) => (Number.isInteger(v) && v >= min && v <= max) || `Enter a whole number from ${min} to ${max}` });
const Section = ({ title, hint, children }) => (
  <section className="card p-4 sm:p-5"><h2 className="text-base font-semibold">{title}</h2>{hint && <p className="mt-0.5 text-sm text-ink-500">{hint}</p>}<div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></section>
);
const Toggle = ({ label, hint, reg }) => (
  <label className="flex items-start gap-3 rounded-md border border-ink-200 p-3 sm:col-span-2"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" {...reg} /><span><span className="block text-sm font-medium">{label}</span>{hint && <span className="text-xs text-ink-500">{hint}</span>}</span></label>
);

function Form({ data }) {
  const qc = useQueryClient(); const { push } = useToast();
  const { register, handleSubmit, reset, setError, formState: { errors, isDirty } } = useForm({ defaultValues: data });
  const m = useMutation({
    mutationFn: updateSettings,
    onSuccess: (saved) => { qc.setQueryData(['admin', 'settings'], saved); qc.invalidateQueries({ queryKey: ['admin', 'audit'] }); reset(saved); push('Settings saved and recorded in the audit log', 'success'); },
    onError: (e) => {
      if (e.code === 'VALIDATION_ERROR' && e.details?.length) e.details.forEach((d) => setError(d.path, { type: 'server', message: d.message }));
      else push(friendlyError(e), 'error');
    },
  });
  const e = (g, k) => errors[g]?.[k]?.message;
  return (
    <form onSubmit={handleSubmit((v) => m.mutate(v))} noValidate className="space-y-5">
      <Section title="Session" hint="Users are signed out after this long without activity, on the server and in the browser.">
        <FieldRow label="Inactivity timeout (hours)" hint="1 to 168. Default 24." error={e('session', 'inactivityTimeoutHours')}>{(id) => <input id={id} type="number" className={inputCls} {...register('session.inactivityTimeoutHours', num(1, 168))} />}</FieldRow>
      </Section>
      <Section title="Login protection" hint="Accounts lock automatically after repeated failed logins.">
        <FieldRow label="Failed attempts before lockout" hint="3 to 10. Default 5." error={e('security', 'maxFailedLogins')}>{(id) => <input id={id} type="number" className={inputCls} {...register('security.maxFailedLogins', num(3, 10))} />}</FieldRow>
        <FieldRow label="Lockout duration (minutes)" hint="1 to 1440." error={e('security', 'lockoutMinutes')}>{(id) => <input id={id} type="number" className={inputCls} {...register('security.lockoutMinutes', num(1, 1440))} />}</FieldRow>
        <Toggle label="Email the account owner when an account is locked" reg={register('security.notifyOnLockout')} />
        <Toggle label="Email the account owner when an account is suspended or restored" reg={register('security.notifyOnSuspension')} />
      </Section>
      <Section title="Notifications">
        <FieldRow label="Subscription expiry reminder (days before)" error={e('notifications', 'expiryReminderDays')}>{(id) => <input id={id} type="number" className={inputCls} {...register('notifications.expiryReminderDays', num(1, 60))} />}</FieldRow>
        <div className="hidden sm:block" />
        <Toggle label="Daily security digest to administrators" hint="Failed logins, lockouts and suspensions from the last 24 hours." reg={register('notifications.securityDigest')} />
        <Toggle label="Send overdue invoice reminders to clients" reg={register('notifications.overdueInvoiceReminders')} />
      </Section>
      <Section title="Application">
        <FieldRow label="Support email" error={e('application', 'supportEmail')}>{(id) => <input id={id} type="email" className={inputCls} {...register('application.supportEmail', { required: 'Required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' } })} />}</FieldRow>
        <FieldRow label="Default currency">{(id) => <select id={id} className={inputCls} {...register('application.defaultCurrency')}><option>UGX</option><option>KES</option><option>TZS</option><option>USD</option></select>}</FieldRow>
        <FieldRow label="Default timezone">{(id) => <select id={id} className={inputCls} {...register('application.defaultTimezone')}><option>Africa/Kampala</option><option>Africa/Nairobi</option><option>Africa/Dar_es_Salaam</option><option>UTC</option></select>}</FieldRow>
        <Toggle label="Maintenance mode" hint="Only super admins can sign in while this is on." reg={register('application.maintenanceMode')} />
      </Section>
      <div className="sticky bottom-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-200 bg-white/95 p-3 shadow-pop backdrop-blur lg:bottom-4">
        <p className="text-xs text-ink-500">Last changed by {data.updatedBy} on {fmtStamp(data.updatedAt)}</p>
        <div className="flex gap-2"><Button type="button" variant="secondary" disabled={!isDirty} onClick={() => reset(data)}>Discard</Button><Button type="submit" loading={m.isPending} disabled={!isDirty}>Save changes</Button></div>
      </div>
    </form>
  );
}

export default function AdminSettings() {
  useEffect(() => { document.title = 'System settings · BizPulse'; }, []);
  const q = useQuery({ queryKey: ['admin', 'settings'], queryFn: getSettings });
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageIntro>System-wide settings. Only super admins can change them and every change is written to the audit log.</PageIntro>
      {q.isPending ? <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}</div>
        : q.isError ? <ErrorState title="Could not load settings" message={friendlyError(q.error)} onRetry={() => q.refetch()} />
          : <Form key={q.data.updatedAt} data={q.data} />}
    </div>
  );
}
