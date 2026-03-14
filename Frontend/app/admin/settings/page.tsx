'use client';

import { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { PageHeader, Card, Input, Select, LoadingButton } from '@/components/ui/SharedComponents';
import { useToast } from '@/components/ui/Toast';

const BACKUP_OPTIONS = [
    { value: 'hourly', label: 'Every Hour' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-red-600' : 'bg-zinc-700'}`}
        >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
        </button>
    );
}

export default function AdminSettingsPage() {
    const toast = useToast();
    const [saved, setSaved] = useState<Record<string, boolean>>({});
    const [gymName, setGymName] = useState('PowerWorld Gyms — Kiribathgoda');
    const [email, setEmail] = useState('kiribathgoda@powerworld.lk');
    const [phone, setPhone] = useState('+94 11 234 5678');
    const [address, setAddress] = useState('No. 45, Kandy Road, Kiribathgoda, Sri Lanka');
    const [capacity, setCapacity] = useState('80');
    const [openTime, setOpenTime] = useState('05:30');
    const [closeTime, setCloseTime] = useState('22:00');
    const [maintenanceMode, setMaintMode] = useState(false);
    const [emailNotify, setEmailNotify] = useState(true);
    const [smsNotify, setSmsNotify] = useState(false);
    const [autoBackup, setAutoBackup] = useState(true);
    const [backupFreq, setBackupFreq] = useState('daily');

    const save = (section: string) => {
        setSaved(prev => ({ ...prev, [section]: true }));
        toast.success('Settings Saved', 'Your changes have been saved successfully');
        setTimeout(() => setSaved(prev => ({ ...prev, [section]: false })), 2000);
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title="System Settings"
                subtitle="Configure PowerWorld Kiribathgoda branch settings"
            />

            <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">Gym Information</h2>
                    <LoadingButton
                        icon={saved.info ? Check : Save}
                        onClick={() => save('info')}
                        className={saved.info ? 'bg-emerald-600 hover:bg-emerald-600' : ''}
                    >
                        {saved.info ? 'Saved' : 'Save'}
                    </LoadingButton>
                </div>
                <div className="space-y-4">
                    <Input label="Branch Name" value={gymName} onChange={e => setGymName(e.target.value)} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                        <Input label="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <Input label="Address" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
            </Card>

            <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">Operating Hours & Capacity</h2>
                    <LoadingButton icon={saved.ops ? Check : Save} onClick={() => save('ops')}>
                        {saved.ops ? 'Saved' : 'Save'}
                    </LoadingButton>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Opens at" type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} />
                    <Input label="Closes at" type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} />
                    <Input label="Max Capacity" type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />
                </div>
            </Card>

            <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">Notifications</h2>
                    <LoadingButton icon={saved.notif ? Check : Save} onClick={() => save('notif')}>
                        {saved.notif ? 'Saved' : 'Save'}
                    </LoadingButton>
                </div>
                <div className="space-y-4">
                    {[
                        { label: 'Email Notifications', sub: 'Send automated emails for payments, reminders', value: emailNotify, set: () => setEmailNotify(!emailNotify) },
                        { label: 'SMS Notifications', sub: 'Send SMS for important alerts', value: smsNotify, set: () => setSmsNotify(!smsNotify) },
                    ].map(n => (
                        <div key={n.label} className="flex items-center justify-between">
                            <div>
                                <p className="text-white text-sm font-semibold">{n.label}</p>
                                <p className="text-zinc-500 text-xs">{n.sub}</p>
                            </div>
                            <Toggle value={n.value} onChange={n.set} />
                        </div>
                    ))}
                </div>
            </Card>

            <Card padding="lg">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-semibold">System</h2>
                    <LoadingButton icon={saved.sys ? Check : Save} onClick={() => save('sys')}>
                        {saved.sys ? 'Saved' : 'Save'}
                    </LoadingButton>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm font-semibold">Automatic Backups</p>
                            <p className="text-zinc-500 text-xs">Backup database automatically</p>
                        </div>
                        <Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
                    </div>
                    {autoBackup && (
                        <Select
                            label="Backup Frequency"
                            options={BACKUP_OPTIONS}
                            value={backupFreq}
                            onChange={e => setBackupFreq(e.target.value)}
                        />
                    )}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        <div>
                            <p className="text-red-400 text-sm font-semibold">Maintenance Mode</p>
                            <p className="text-zinc-500 text-xs">Takes the system offline for all non-admin users</p>
                        </div>
                        <Toggle value={maintenanceMode} onChange={() => setMaintMode(!maintenanceMode)} />
                    </div>
                </div>
            </Card>
        </div>
    );
}
