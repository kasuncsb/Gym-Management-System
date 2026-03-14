'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Plus, X, Check } from 'lucide-react';

interface Appointment {
    id: number;
    trainer: string;
    date: string;
    time: string;
    type: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

const appointments: Appointment[] = [
    { id: 1, trainer: 'Chathurika Silva',  date: '2025-01-18', time: '10:00 AM', type: 'Personal Training',       status: 'upcoming' },
    { id: 2, trainer: 'Isuru Bandara',     date: '2025-01-20', time: '2:00 PM',  type: 'Nutrition Consultation',  status: 'upcoming' },
    { id: 3, trainer: 'Ruwan Jayawardena', date: '2025-01-10', time: '9:00 AM',  type: 'Fitness Assessment',     status: 'completed' },
    { id: 4, trainer: 'Nirosha Senanayake',date: '2025-01-05', time: '3:00 PM',  type: 'Personal Training',       status: 'cancelled' },
];

const trainers = ['Chathurika Silva', 'Isuru Bandara', 'Ruwan Jayawardena', 'Nirosha Senanayake'];
const sessionTypes = ['Personal Training', 'Nutrition Consultation', 'Fitness Assessment', 'Group Class'];

const statusStyles: Record<string, string> = {
    upcoming:  'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
};

export default function AppointmentsPage() {
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ trainer: '', date: '', time: '', type: '' });

    const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                        <Calendar size={28} className="text-red-500" /> Appointments
                    </h1>
                    <p className="text-zinc-400">Manage your personal training sessions</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all">
                    <Plus size={16} /> Book Session
                </button>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                        {f}
                    </button>
                ))}
            </div>

            {/* Appointments */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-zinc-600">No {filter} appointments.</div>
                )}
                {filtered.map(a => (
                    <div key={a.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-white font-semibold">{a.trainer}</p>
                                <p className="text-zinc-500 text-sm">{a.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-white text-sm font-semibold flex items-center gap-1 justify-end">
                                    <Calendar size={12} className="text-zinc-500" /> {a.date}
                                </p>
                                <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                                    <Clock size={11} /> {a.time}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusStyles[a.status]}`}>{a.status}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Book modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">Book a Session</h2>
                            <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-300"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'Trainer', field: 'trainer', type: 'select', options: trainers },
                                { label: 'Session Type', field: 'type', type: 'select', options: sessionTypes },
                                { label: 'Date', field: 'date', type: 'date', options: [] },
                                { label: 'Time', field: 'time', type: 'time', options: [] },
                            ].map(({ label, field, type, options }) => (
                                <div key={field}>
                                    <label className="block text-sm text-zinc-400 mb-1">{label}</label>
                                    {type === 'select' ? (
                                        <select value={form[field as keyof typeof form]}
                                            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500">
                                            <option value="">Select {label}</option>
                                            {options.map(o => <option key={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <input type={type} value={form[field as keyof typeof form]}
                                            onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-500" />
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setShowModal(false)}
                                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
                                <Check size={16} /> Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
