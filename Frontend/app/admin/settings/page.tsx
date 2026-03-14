'use client';

import { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';

export default function AdminSettingsPage() {
    const [saved, setSaved]   = useState<Record<string, boolean>>({});
    const [gymName, setGymName]             = useState('PowerWorld Gyms — Kiribathgoda');
    const [email, setEmail]                 = useState('kiribathgoda@powerworld.lk');
    const [phone, setPhone]                 = useState('+94 11 234 5678');
    const [address, setAddress]             = useState('No. 45, Kandy Road, Kiribathgoda, Sri Lanka');
    const [capacity, setCapacity]           = useState('80');
    const [openTime, setOpenTime]           = useState('05:30');
    const [closeTime, setCloseTime]         = useState('22:00');
    const [maintenanceMode, setMaintMode]   = useState(false);
    const [emailNotify, setEmailNotify]     = useState(true);
    const [smsNotify, setSmsNotify]         = useState(false);
    const [autoBackup, setAutoBackup]       = useState(true);
    const [backupFreq, setBackupFreq]       = useState('daily');

    const save = (section: string) => {
        setSaved(prev => ({ ...prev, [section]: true }));
        setTimeout(() => setSaved(prev => ({ ...prev, [section]: false })), 2000);
    };

    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button onClick={onChange} className={`relative w-10 h-6 rounded-full transition-colors ${value ? 'bg-red-600' : 'bg-zinc-700'}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-5' : 'left-1'}`} />
        </button>
    );

    const SaveBtn = ({ section }: { section: string }) => (
        <button onClick={() => save(section)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${saved[section] ? 'bg-green-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
            {saved[section] ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save</>}
        </button>
    );

    const Card = ({ title, children, section }: { title: string; children: React.ReactNode; section: string }) => (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-white font-semibold">{title}</h2>
                <SaveBtn section={section} />
            </div>
            {children}
        </div>
    );

    const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <label className="block text-sm text-zinc-400 mb-1">{label}</label>
            {children}
        </div>
    );

    const Input = ({ value, onChange, type = 'text' }: { value: string; onChange: (v: string) => void; type?: string }) => (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500" />
    );

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <Settings size={28} className="text-zinc-400" /> System Settings
                </h1>
                <p className="text-zinc-400">Configure PowerWorld Kiribathgoda branch settings</p>
            </div>

            <Card title="Gym Information" section="info">
                <Field label="Branch Name"><Input value={gymName} onChange={setGymName} /></Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="Email"><Input value={email} onChange={setEmail} type="email" /></Field>
                    <Field label="Phone"><Input value={phone} onChange={setPhone} /></Field>
                </div>
                <Field label="Address"><Input value={address} onChange={setAddress} /></Field>
            </Card>

            <Card title="Operating Hours & Capacity" section="ops">
                <div className="grid grid-cols-3 gap-4">
                    <Field label="Opens at"><Input value={openTime} onChange={setOpenTime} type="time" /></Field>
                    <Field label="Closes at"><Input value={closeTime} onChange={setCloseTime} type="time" /></Field>
                    <Field label="Max Capacity"><Input value={capacity} onChange={setCapacity} type="number" /></Field>
                </div>
            </Card>

            <Card title="Notifications" section="notif">
                {[
                    { label: 'Email Notifications', sub: 'Send automated emails for payments, reminders', value: emailNotify, set: () => setEmailNotify(!emailNotify) },
                    { label: 'SMS Notifications',   sub: 'Send SMS for important alerts',              value: smsNotify,   set: () => setSmsNotify(!smsNotify) },
                ].map(n => (
                    <div key={n.label} className="flex items-center justify-between">
                        <div>
                            <p className="text-white text-sm font-semibold">{n.label}</p>
                            <p className="text-zinc-500 text-xs">{n.sub}</p>
                        </div>
                        <Toggle value={n.value} onChange={n.set} />
                    </div>
                ))}
            </Card>

            <Card title="System" section="sys">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white text-sm font-semibold">Automatic Backups</p>
                        <p className="text-zinc-500 text-xs">Backup database automatically</p>
                    </div>
                    <Toggle value={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
                </div>
                {autoBackup && (
                    <Field label="Backup Frequency">
                        <select value={backupFreq} onChange={e => setBackupFreq(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500">
                            <option value="hourly">Every Hour</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </Field>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <div>
                        <p className="text-red-400 text-sm font-semibold">Maintenance Mode</p>
                        <p className="text-zinc-500 text-xs">Takes the system offline for all non-admin users</p>
                    </div>
                    <Toggle value={maintenanceMode} onChange={() => setMaintMode(!maintenanceMode)} />
                </div>
            </Card>
        </div>
    );
}
