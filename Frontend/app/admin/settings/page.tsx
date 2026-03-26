'use client';

import { useEffect, useMemo, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { PageHeader, Card, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage, opsAPI } from '@/lib/api';

const BACKUP_FREQ = [
    { value: 'hourly', label: 'Every hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <button type="button" onClick={onChange} className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-red-600' : 'bg-zinc-700'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
        </button>
    );
}

const KEYS = [
    'branch_capacity',
    'checkin_qr_ttl_seconds',
    'checkin_scan_max_retries',
    'subscription_freeze_max_days',
    'payment_failure_max_retries',
    'login_failure_lock_threshold',
    'login_failure_lock_minutes',
    'db_backup_retention_days',
    'ai_chat_rate_limit_per_minute',
    'pt_booking_advance_days_max',
    'session_idle_timeout_minutes',
    'email_queue_max_attempts',
] as const;

export default function AdminSettingsPage() {
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [vals, setVals] = useState<Record<string, string>>({});
    const [maint, setMaint] = useState(false);
    const [emailN, setEmailN] = useState(true);
    const [smsN, setSmsN] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFreq, setBackupFreq] = useState('daily');

    useEffect(() => {
        opsAPI
            .config()
            .then((rows: any[]) => {
                const m = new Map((rows ?? []).map((r) => [r.key, r.value]));
                const next: Record<string, string> = {};
                for (const k of KEYS) next[k] = m.get(k) ?? '';
                setVals(next);
                setMaint(m.get('maintenance_mode') === 'true');
                setEmailN(m.get('notify_email') !== 'false');
                setSmsN(m.get('notify_sms') === 'true');
                setAutoBackup(m.get('auto_backup') !== 'false');
                setBackupFreq(m.get('db_backup_frequency') ?? m.get('backup_frequency') ?? 'daily');
            })
            .catch((err) => toast.error('Failed to load settings', getErrorMessage(err)))
            .finally(() => setLoading(false));
    }, []);

    const payload = useMemo(() => {
        const o: Record<string, string> = {
            maintenance_mode: String(maint),
            notify_email: String(emailN),
            notify_sms: String(smsN),
            auto_backup: String(autoBackup),
            db_backup_frequency: backupFreq,
        };
        for (const k of KEYS) {
            if (vals[k] != null && String(vals[k]).trim() !== '') o[k] = String(vals[k]).trim();
        }
        return o;
    }, [vals, maint, emailN, smsN, autoBackup, backupFreq]);

    const saveAll = () => {
        setSaving(true);
        opsAPI
            .updateConfig(payload)
            .then(() => {
                setSaved(true);
                toast.success('Settings saved', 'All configuration keys were updated.');
                setTimeout(() => setSaved(false), 2000);
            })
            .catch((err) => toast.error('Save failed', getErrorMessage(err)))
            .finally(() => setSaving(false));
    };

    const n = (key: (typeof KEYS)[number], label: string, hint?: string) => (
        <div key={key}>
            <Input id={`cfg-${key}`} label={label} value={vals[key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))} />
            {hint && <p className="text-zinc-600 text-xs mt-1">{hint}</p>}
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-8">
                <PageHeader title="System settings" subtitle="Loading…" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl">
            <PageHeader
                title="System settings"
                subtitle="Dynamic business configuration (.env still wins for secrets and infrastructure). One save updates every key below."
            />

            <Card padding="lg" className="space-y-6">
                <h2 className="text-white font-semibold flex items-center gap-2">
                    <Settings size={18} className="text-red-400" />
                    Check-in &amp; access
                </h2>
                {n('branch_capacity', 'Max people in facility (display / capacity bar)', 'Used on check-in dashboards.')}
                {n('checkin_qr_ttl_seconds', 'Door QR time-to-live (seconds)', '15–600; simulator and hardware challenges.')}
                {n('checkin_scan_max_retries', 'Max failed scan attempts per session', 'Client hint; enforce in future rate limiter.')}
            </Card>

            <Card padding="lg" className="space-y-6">
                <h2 className="text-white font-semibold">Subscriptions &amp; payments</h2>
                {n('subscription_freeze_max_days', 'Maximum freeze duration (days)', 'Policy guard for freeze requests.')}
                {n('payment_failure_max_retries', 'Payment retry budget', 'For billing workers / future automation.')}
            </Card>

            <Card padding="lg" className="space-y-6">
                <h2 className="text-white font-semibold">Security &amp; sessions</h2>
                {n('login_failure_lock_threshold', 'Failed logins before lockout', 'Applied on next failed login.')}
                {n('login_failure_lock_minutes', 'Account lock duration (minutes)')}
                {n('session_idle_timeout_minutes', 'Idle session hint (minutes)', 'Documented for clients; refresh TTL is JWT-driven.')}
            </Card>

            <Card padding="lg" className="space-y-6">
                <h2 className="text-white font-semibold">Operations &amp; AI</h2>
                {n('db_backup_retention_days', 'Backup retention (days)')}
                {n('ai_chat_rate_limit_per_minute', 'AI chat requests / user / minute', 'Documented for gateway tuning.')}
                {n('pt_booking_advance_days_max', 'PT booking horizon (days)')}
                {n('email_queue_max_attempts', 'Outbound email max attempts')}
                <Select label="Backup frequency" options={BACKUP_FREQ} value={backupFreq} onChange={(e) => setBackupFreq(e.target.value)} />
                <div className="flex items-center justify-between pt-2">
                    <div>
                        <p className="text-white text-sm font-semibold">Automatic backups</p>
                        <p className="text-zinc-500 text-xs">Policy flag for backup jobs</p>
                    </div>
                    <Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
                </div>
            </Card>

            <Card padding="lg" className="space-y-5">
                <h2 className="text-white font-semibold">Notifications &amp; maintenance</h2>
                {[
                    { label: 'Email notifications', sub: 'Operational emails', value: emailN, set: () => setEmailN(!emailN) },
                    { label: 'SMS notifications', sub: 'High-priority SMS', value: smsN, set: () => setSmsN(!smsN) },
                ].map((x) => (
                    <div key={x.label} className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm font-semibold">{x.label}</p>
                            <p className="text-zinc-500 text-xs">{x.sub}</p>
                        </div>
                        <Toggle value={x.value} onChange={x.set} />
                    </div>
                ))}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                    <div>
                        <p className="text-red-400 text-sm font-semibold">Maintenance mode</p>
                        <p className="text-zinc-500 text-xs">Non-admin users see maintenance screen</p>
                    </div>
                    <Toggle value={maint} onChange={() => setMaint(!maint)} />
                </div>
            </Card>

            <div className="sticky bottom-4 z-20 flex justify-end">
                <LoadingButton size="lg" loading={saving} icon={saved ? Check : Save} onClick={saveAll} className={saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}>
                    {saved ? 'Saved' : 'Save all settings'}
                </LoadingButton>
            </div>
        </div>
    );
}
