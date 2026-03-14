'use client';

import { UserCheck, Star, Clock, Dumbbell } from 'lucide-react';

const staff = [
    { name: 'Chathurika Silva',  role: 'Personal Trainer',      members: 14, sessions: 52, rating: 4.9, shift: '6AM – 2PM',  status: 'on_shift' },
    { name: 'Isuru Bandara',     role: 'Personal Trainer',      members: 11, sessions: 44, rating: 4.7, shift: '2PM – 10PM', status: 'off_shift' },
    { name: 'Ruwan Jayawardena', role: 'Senior Trainer',        members: 18, sessions: 67, rating: 4.8, shift: '6AM – 2PM',  status: 'on_shift' },
    { name: 'Nirosha Senanayake',role: 'Fitness Consultant',    members: 8,  sessions: 31, rating: 4.5, shift: '10AM – 6PM', status: 'on_shift' },
    { name: 'Kasun Perera',      role: 'Operations Staff',      members: 0,  sessions: 0,  rating: 4.6, shift: '6AM – 2PM',  status: 'on_shift' },
];

export default function ManagerStaffPage() {
    const onShift = staff.filter(s => s.status === 'on_shift').length;

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                    <UserCheck size={28} className="text-green-400" /> Staff Management
                </h1>
                <p className="text-zinc-400">Staff overview for PowerWorld Kiribathgoda</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-white">{staff.length}</p>
                    <p className="text-zinc-500 text-xs">Total Staff</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-green-400">{onShift}</p>
                    <p className="text-zinc-500 text-xs">Currently On Shift</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-yellow-400">{staff.length - onShift}</p>
                    <p className="text-zinc-500 text-xs">Off Shift</p>
                </div>
            </div>

            {/* Staff cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {staff.map((s, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white font-bold">
                                {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-white font-semibold">{s.name}</p>
                                <p className="text-zinc-500 text-xs">{s.role}</p>
                            </div>
                            <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.status === 'on_shift' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
                                {s.status === 'on_shift' ? '● On Shift' : 'Off Shift'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="flex items-center justify-center gap-1 text-sm font-bold text-white"><Dumbbell size={12} /> {s.members}</div>
                                <p className="text-zinc-600 text-[10px]">Members</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="text-sm font-bold text-white">{s.sessions}</div>
                                <p className="text-zinc-600 text-[10px]">Sessions</p>
                            </div>
                            <div className="bg-zinc-800/40 rounded-xl py-2">
                                <div className="flex items-center justify-center gap-1 text-sm font-bold text-yellow-400"><Star size={11} /> {s.rating}</div>
                                <p className="text-zinc-600 text-[10px]">Rating</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Clock size={11} /> Shift: {s.shift}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
